'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DataTable } from '@/components/data-table/data-table'
import { createUserColumns } from './components/user-columns'
import { AddUserDialog } from './components/add-user-dialog'
import { EditUserDialog } from './components/edit-user-dialog'
import { UserDetailsModal } from './components/user-details-modal'
import { InviteUserDialog } from '@/components/invite-user-dialog'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { createClient } from '@/lib/supabase/client'
import type { UserFull, UserFormData } from '@/lib/types/users'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus, Mail } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function UsersPageContent() {
  const searchParams = useSearchParams()
  const { role, isLoading: roleLoading } = useUserRole()
  const { user: clerkUser } = useUser()
  const [users, setUsers] = useState<UserFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserFull | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserFull | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'invited'>('all')
  const [invitations, setInvitations] = useState<Array<{ id: string; email_address: string; status: string; created_at: string }>>([])
  const [invitationsLoading, setInvitationsLoading] = useState(false)

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (roleLoading || !role) return

    try {
      setLoading(true)

      // Check for missing environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase environment variables not set')
        setUsers([])
        setInitialLoading(false)
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Set Clerk user ID in Supabase session for RLS policies
      if (clerkUser?.id) {
        try {
          await supabase.rpc('set_clerk_user_id', { p_user_id: clerkUser.id })
        } catch (e) {
          console.warn('Failed to set Clerk user ID in Supabase session:', e)
        }
      }

      // Check if Clerk user is available
      if (!clerkUser?.id) {
        console.warn('No authenticated Clerk user')
        setUsers([])
        setInitialLoading(false)
        setLoading(false)
        return
      }

      // Build query for profiles with department
      let query = supabase
        .from('profiles')
        .select(
          `
          *,
          department:departments!profiles_department_id_fkey(id, name)
        `
        )
        .is('deleted_at', null)

      // Apply search
      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
        )
      }

      // Apply sorting
      if (sorting.length > 0) {
        const sort = sorting[0]
        query = query.order(sort.id, { ascending: !sort.desc })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data: profilesData, error } = await query

      if (error) {
        console.error('Error fetching profiles:', error)
        throw error
      }

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile: any) => {
          // Get role bindings for this user
          const { data: roleBindings } = await supabase
            .from('user_role_bindings')
            .select('role_id')
            .eq('user_id', profile.user_id)

          if (!roleBindings || roleBindings.length === 0) {
            return {
              ...profile,
              roles: [],
              clerk_user_id: profile.user_id,
            } as UserFull
          }

          // Get role details
          const roleIds = roleBindings.map((rb: any) => rb.role_id)
          const { data: roles } = await supabase
            .from('roles')
            .select('id, name, description')
            .in('id', roleIds)
            .is('deleted_at', null)

          return {
            ...profile,
            roles: roles || [],
            clerk_user_id: profile.user_id,
          } as UserFull
        })
      )

      // Apply client-side filters
      let filteredUsers = usersWithRoles
      if (filters.length > 0) {
        filters.forEach((filter) => {
          if (filter.id === 'role' && filter.value && Array.isArray(filter.value)) {
            filteredUsers = filteredUsers.filter((user) =>
              user.roles.some((r) => filter.value.includes(r.name))
            )
          }
          if (filter.id === 'department' && filter.value && Array.isArray(filter.value)) {
            filteredUsers = filteredUsers.filter((user) =>
              user.department_id && filter.value.includes(user.department_id)
            )
          }
        })
      }

      // Apply tab filter
      if (activeTab === 'invited') {
        // For invited users, show only users who don't have a profile yet
        // We'll handle this by showing invitations instead of users
        // This will be handled in the render section
      }

      // Apply pagination
      const totalCount = filteredUsers.length
      const from = (page - 1) * pageSize
      const to = from + pageSize
      const paginatedUsers = filteredUsers.slice(from, to)

      setUsers(paginatedUsers)
      setPageCount(Math.ceil(totalCount / pageSize))
      setInitialLoading(false)
    } catch (error) {
      console.error('Error fetching users:', error)
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, null, 2))
      }
      toast.error('Failed to load users')
      setUsers([])
      setPageCount(0)
      setInitialLoading(false)
    } finally {
      setLoading(false)
    }
  }, [role, roleLoading, searchParams, search, pageSize, page, sorting, filters, clerkUser?.id])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const fetchInvitations = useCallback(async () => {
    try {
      setInvitationsLoading(true)
      const response = await fetch('/api/users/invitations?status=pending')
      const result = await response.json()

      if (response.ok && result.invitations) {
        setInvitations(result.invitations)
      } else {
        console.error('Error fetching invitations:', result.error)
        setInvitations([])
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
      setInvitations([])
    } finally {
      setInvitationsLoading(false)
    }
  }, [])

  // Fetch invitations when "Invited Users" tab is active
  useEffect(() => {
    if (activeTab === 'invited') {
      fetchInvitations()
    }
  }, [activeTab, fetchInvitations])

  // Get role and department options for filters
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: string }[]>([])

  useEffect(() => {
    async function fetchOptions() {
      try {
        const supabase = createClient()

        // Fetch roles
        const { data: roles } = await supabase
          .from('roles')
          .select('id, name')
          .is('deleted_at', null)
          .order('name')

        if (roles) {
          setRoleOptions(roles.map((r) => ({ label: r.name, value: r.name })))
        }

        // Fetch departments
        const { data: departments } = await supabase
          .from('departments')
          .select('id, name')
          .is('deleted_at', null)
          .order('name')

        if (departments) {
          setDepartmentOptions(departments.map((d) => ({ label: d.name, value: d.id })))
        }
      } catch (error) {
        console.error('Error fetching options:', error)
      }
    }

    fetchOptions()
  }, [])

  const handleAddUser = () => {
    setEditingUser(null)
    setAddDialogOpen(true)
  }

  const handleEditUser = (user: UserFull) => {
    setEditingUser(user)
    setEditDialogOpen(true)
  }

  const handleViewUser = (user: UserFull) => {
    setSelectedUser(user)
    setDetailsModalOpen(true)
  }

  const handleDeleteUser = async (user: UserFull) => {
    if (!confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) return

    try {
      const supabase = createClient()

      // Set Clerk user ID
      if (clerkUser?.id) {
        try {
          await supabase.rpc('set_clerk_user_id', { p_user_id: clerkUser.id })
        } catch (e) {
          console.warn('Failed to set Clerk user ID:', e)
        }
      }

      // Soft delete profile
      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const handleSubmitUser = async (data: UserFormData) => {
    try {
      const supabase = createClient()

      // Set Clerk user ID
      if (clerkUser?.id) {
        try {
          await supabase.rpc('set_clerk_user_id', { p_user_id: clerkUser.id })
        } catch (e) {
          console.warn('Failed to set Clerk user ID:', e)
        }
      }

      if (editingUser) {
        // Update existing user
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            department_id: data.department_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUser.id)

        if (profileError) throw profileError

        // Update role bindings
        // First, get current role bindings
        const { data: currentBindings } = await supabase
          .from('user_role_bindings')
          .select('id, role_id')
          .eq('user_id', editingUser.user_id)

        const currentRoleIds = (currentBindings || []).map((b: any) => b.role_id)
        const newRoleIds = data.role_ids

        // Find roles to add and remove
        const rolesToAdd = newRoleIds.filter((id) => !currentRoleIds.includes(id))
        const rolesToRemove = currentRoleIds.filter((id) => !newRoleIds.includes(id))

        // Remove old role bindings
        if (rolesToRemove.length > 0) {
          const { error: removeError } = await supabase
            .from('user_role_bindings')
            .delete()
            .eq('user_id', editingUser.user_id)
            .in('role_id', rolesToRemove)

          if (removeError) throw removeError
        }

        // Add new role bindings
        if (rolesToAdd.length > 0) {
          const { error: addError } = await supabase.from('user_role_bindings').insert(
            rolesToAdd.map((roleId) => ({
              user_id: editingUser.user_id,
              role_id: roleId,
              created_by: clerkUser?.id || null,
            }))
          )

          if (addError) throw addError
        }

        toast.success('User updated successfully')
      } else {
        // User was already created via API in the dialog
        // Just refresh the user list
        toast.success('User created successfully')
      }

      setAddDialogOpen(false)
      setEditDialogOpen(false)
      setEditingUser(null)
      fetchUsers()
      // Refresh invitations if on invited tab
      if (activeTab === 'invited') {
        fetchInvitations()
      }
    } catch (error) {
      console.error('Error saving user:', error)
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, null, 2))
      }
      toast.error(editingUser ? 'Failed to update user' : 'Failed to create user')
      throw error
    }
  }

  const columns = createUserColumns(handleViewUser, handleEditUser, handleDeleteUser)

  const filterConfig = [
    {
      columnId: 'roles',
      title: 'Role',
      options: roleOptions,
    },
    {
      columnId: 'department',
      title: 'Department',
      options: departmentOptions,
    },
  ]

  if (roleLoading) {
    return <PageLoader />
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">User Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setInviteDialogOpen(true)}
            className="h-8 px-3"
          >
            <Mail className="mr-2 h-4 w-4" />
            <span className="text-sm">Invite User</span>
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'all' | 'invited')}
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        <TabsList className="flex-shrink-0 mb-2 w-fit">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="invited">
            Invited Users
            {invitations.length > 0 && ` (${invitations.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 overflow-hidden min-h-0 mt-0">
        <DataTable
          columns={columns}
          data={users}
          pageCount={pageCount}
          onPaginationChange={(p, s) => {
            setPage(p)
            setPageSize(s)
          }}
          onSortingChange={setSorting}
          onFilterChange={setFilters}
          onSearchChange={setSearch}
          loading={loading}
          initialLoading={initialLoading}
          onAdd={handleAddUser}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onView={handleViewUser}
          filterConfig={filterConfig}
          searchPlaceholder="Search users..."
          addButtonText="Add User"
          addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
          />
        </TabsContent>

        <TabsContent value="invited" className="flex-1 overflow-hidden min-h-0 mt-0">
          {invitationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <PageLoader />
            </div>
          ) : invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pending invitations</p>
              <p className="text-sm text-muted-foreground mt-2">
                Invite users to see them here
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden min-h-0">
              <DataTable
                columns={[
                  {
                    accessorKey: 'email_address',
                    header: 'Email',
                  },
                  {
                    accessorKey: 'status',
                    header: 'Status',
                    cell: ({ row }) => {
                      const status = row.getValue('status') as string
                      return (
                        <span className="capitalize px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 text-xs">
                          {status}
                        </span>
                      )
                    },
                  },
                  {
                    accessorKey: 'created_at',
                    header: 'Invited On',
                    cell: ({ row }) => {
                      const date = row.getValue('created_at') as string
                      return new Date(date).toLocaleDateString()
                    },
                  },
                ]}
                data={invitations}
                pageCount={Math.ceil(invitations.length / pageSize)}
                onPaginationChange={(p, s) => {
                  setPage(p)
                  setPageSize(s)
                }}
                onSortingChange={setSorting}
                onFilterChange={setFilters}
                onSearchChange={setSearch}
                loading={invitationsLoading}
                initialLoading={invitationsLoading}
                filterConfig={[]}
                searchPlaceholder="Search invitations..."
        />
      </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs and Modals - outside scrollable container */}
      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open)
          if (!open) {
            setEditingUser(null)
          }
        }}
        onSubmit={handleSubmitUser}
        roleOptions={roleOptions}
        departmentOptions={departmentOptions}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setEditingUser(null)
          }
        }}
        user={editingUser}
        onSubmit={handleSubmitUser}
        roleOptions={roleOptions}
        departmentOptions={departmentOptions}
      />

      <UserDetailsModal
        user={selectedUser}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onEdit={(user) => {
          setSelectedUser(null)
          setDetailsModalOpen(false)
          handleEditUser(user)
        }}
        onDelete={handleDeleteUser}
      />

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={() => {
          // Refresh the user list after successful invitation
          fetchUsers()
          // Refresh invitations if on invited tab
          if (activeTab === 'invited') {
            fetchInvitations()
          }
        }}
      />
    </div>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <UsersPageContent />
    </Suspense>
  )
}

