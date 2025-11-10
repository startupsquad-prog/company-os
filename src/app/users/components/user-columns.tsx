import { ColumnDef } from '@tanstack/react-table'
import { UserFull } from '@/lib/types/users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils'
// DataTableRowActions not available, using inline actions
import { Shield, Crown, User as UserIcon, Edit, Trash2, Eye } from 'lucide-react'

export const createUserColumns = (
  onView?: (user: UserFull) => void,
  onEdit?: (user: UserFull) => void,
  onDelete?: (user: UserFull) => void
): ColumnDef<UserFull>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => {
      const user = row.original
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No name'
      const initials = getUserInitials(user.first_name, user.last_name, user.email)
      const avatarSeed = user.email || user.id || 'default'

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getDiceBearAvatar(avatarSeed)} alt={fullName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div
              className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
              onClick={() => onView?.(user)}
            >
              {fullName}
            </div>
            <div className="text-xs text-muted-foreground">{user.email || 'No email'}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => {
      return <div className="text-sm">{row.original.email || '—'}</div>
    },
  },
  {
    accessorKey: 'roles',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Roles" />,
    cell: ({ row }) => {
      const roles = row.original.roles || []
      if (roles.length === 0) {
        return <Badge variant="outline">No roles</Badge>
      }

      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => {
            const getRoleIcon = (roleName: string) => {
              switch (roleName.toLowerCase()) {
                case 'superadmin':
                  return <Shield className="h-3 w-3" />
                case 'admin':
                  return <Crown className="h-3 w-3" />
                default:
                  return <UserIcon className="h-3 w-3" />
              }
            }

            const getRoleVariant = (roleName: string): 'default' | 'secondary' | 'outline' => {
              switch (roleName.toLowerCase()) {
                case 'superadmin':
                  return 'default'
                case 'admin':
                  return 'secondary'
                default:
                  return 'outline'
              }
            }

            return (
              <Badge key={role.id} variant={getRoleVariant(role.name)} className="flex items-center gap-1 text-xs">
                {getRoleIcon(role.name)}
                {role.name}
              </Badge>
            )
          })}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const roles = row.getValue(id) as UserFull['roles']
      if (!Array.isArray(value) || value.length === 0) return true
      return roles.some((r) => value.includes(r.name))
    },
  },
  {
    accessorKey: 'department',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
    cell: ({ row }) => {
      const department = row.original.department
      return <div className="text-sm">{department?.name || '—'}</div>
    },
    filterFn: (row, id, value) => {
      const department = row.getValue(id) as UserFull['department']
      if (!Array.isArray(value) || value.length === 0) return true
      return department && value.includes(department.id)
    },
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }) => {
      return <div className="text-sm">{row.original.phone || '—'}</div>
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return <div className="text-sm">{date.toLocaleDateString()}</div>
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const user = row.original

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView?.(user)}
            title="View user"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(user)}
            title="Edit user"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete?.(user)}
            title="Delete user"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
    enableHiding: false,
  },
]

