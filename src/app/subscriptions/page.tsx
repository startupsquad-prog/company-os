'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SubscriptionFull, SubscriptionFormData } from '@/lib/types/subscriptions'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createSubscriptionColumns } from './components/subscription-columns'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { SubscriptionMetrics } from './components/subscription-metrics'
import { SubscriptionDetailsModal } from './components/subscription-details-modal'

function SubscriptionsPageContent() {
  const { user: clerkUser } = useUser()
  const [subscriptions, setSubscriptions] = useState<SubscriptionFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionFull | null>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionFull | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState<SubscriptionFormData>({
    subscription_name: '',
    vendor_id: '',
    vendor_name: '',
    plan_tier: '',
    cost_per_period: undefined,
    cost_per_user: undefined,
    billing_cycle: 'monthly',
    currency: 'USD',
    auto_renewal_status: 'enabled',
    status: 'active',
    number_of_users: 1,
    category: '',
    notes: '',
  })
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([])
  const [allSubscriptions, setAllSubscriptions] = useState<SubscriptionFull[]>([])

  const fetchSubscriptions = useCallback(async () => {
    if (!clerkUser?.id) return

    try {
      setLoading(true)

      // Build query parameters - matching tickets pattern exactly
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search ? { search } : {}),
      })

      // Add status filter
      const statusFilter = filters.find((f) => f.id === 'status')
      if (statusFilter && statusFilter.value) {
        const values = Array.isArray(statusFilter.value) ? statusFilter.value : [statusFilter.value]
        params.append('status', values.join(','))
      }

      // Add sorting
      if (sorting.length > 0) {
        params.append('sortField', sorting[0].id || 'created_at')
        params.append('sortDirection', sorting[0].desc ? 'desc' : 'asc')
      }

      const response = await fetch(`/api/unified/subscriptions?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      setSubscriptions(result.data || [])
      setPageCount(result.totalPages || 0)
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error)
      toast.error(`Failed to load subscriptions: ${error.message || 'Unknown error'}`)
      setSubscriptions([])
      setPageCount(0)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [clerkUser?.id, page, pageSize, sorting, filters, search])

  // Fetch all subscriptions for metrics (unpaginated)
  const fetchAllSubscriptions = useCallback(async () => {
    if (!clerkUser?.id) return

    try {
      // Build query parameters for all subscriptions (no pagination)
      const params = new URLSearchParams({
        page: '1',
        pageSize: '1000', // Large number to get all subscriptions
      })

      const response = await fetch(`/api/unified/subscriptions?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setAllSubscriptions(result.data || [])
    } catch (error: any) {
      console.error('Error fetching all subscriptions for metrics:', error)
      // Set empty array on error so metrics don't break
      setAllSubscriptions([])
    }
  }, [clerkUser?.id])

  useEffect(() => {
    fetchSubscriptions()
    fetchAllSubscriptions()
    const fetchVendors = async () => {
      try {
        const supabase = createClient()
        // Use schema-aware query - contacts is in core schema
        const { data } = await (supabase as any)
          .schema('core')
          .from('contacts')
          .select('id, name')
          .is('deleted_at', null)
          .limit(100)
        setVendors(data || [])
      } catch (error) {
        console.error('Error fetching vendors:', error)
        setVendors([])
      }
    }
    fetchVendors()
  }, [fetchSubscriptions, fetchAllSubscriptions, clerkUser?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clerkUser?.id || !formData.subscription_name.trim()) return

    try {
      const url = '/api/unified/subscriptions'
      const method = editingSubscription ? 'PATCH' : 'POST'

      const payload = {
        ...(editingSubscription ? { id: editingSubscription.id } : {}),
        ...formData,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      toast.success(editingSubscription ? 'Subscription updated successfully' : 'Subscription created successfully')
      setFormOpen(false)
      setEditingSubscription(null)
      await fetchSubscriptions()
      await fetchAllSubscriptions() // Refresh metrics
    } catch (error: any) {
      console.error('Error saving subscription:', error)
      toast.error(error.message || 'Failed to save subscription')
    }
  }

  const handleDelete = async (subscription: SubscriptionFull) => {
    if (!clerkUser?.id) return
    if (!confirm(`Are you sure you want to delete ${subscription.subscription_name}?`)) return

    try {
      const response = await fetch(`/api/unified/subscriptions?id=${subscription.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      toast.success('Subscription deleted successfully')
      await fetchSubscriptions()
      await fetchAllSubscriptions() // Refresh metrics
    } catch (error: any) {
      console.error('Error deleting subscription:', error)
      toast.error(`Failed to delete subscription: ${error.message || 'Unknown error'}`)
    }
  }

  useEffect(() => {
    if (editingSubscription) {
      setFormData({
        subscription_name: editingSubscription.subscription_name,
        vendor_id: editingSubscription.vendor_id || '',
        vendor_name: editingSubscription.vendor_name || '',
        plan_tier: editingSubscription.plan_tier || '',
        cost_per_period: editingSubscription.cost_per_period || undefined,
        cost_per_user: editingSubscription.cost_per_user || undefined,
        billing_cycle: editingSubscription.billing_cycle || 'monthly',
        currency: editingSubscription.currency || 'USD',
        auto_renewal_status: editingSubscription.auto_renewal_status || 'enabled',
        status: editingSubscription.status || 'active',
        number_of_users: editingSubscription.number_of_users || 1,
        category: editingSubscription.category || '',
        notes: editingSubscription.notes || '',
        start_date: editingSubscription.start_date || undefined,
        expiry_date: editingSubscription.expiry_date || undefined,
        renewal_date: editingSubscription.renewal_date || undefined,
      })
    } else {
      setFormData({
        subscription_name: '',
        vendor_id: '',
        vendor_name: '',
        plan_tier: '',
        cost_per_period: undefined,
        cost_per_user: undefined,
        billing_cycle: 'monthly',
        currency: 'USD',
        auto_renewal_status: 'enabled',
        status: 'active',
        number_of_users: 1,
        category: '',
        notes: '',
      })
    }
  }, [editingSubscription, formOpen])

  const columns = createSubscriptionColumns({
    onView: (subscription) => {
      setSelectedSubscription(subscription)
      setDetailsModalOpen(true)
    },
    onEdit: (subscription) => {
      setEditingSubscription(subscription)
      setFormOpen(true)
    },
    onDelete: handleDelete,
  })

  const filterConfig = [
    {
      columnId: 'status',
      title: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Expired', value: 'expired' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Pending', value: 'pending' },
        { label: 'Trial', value: 'trial' },
      ],
    },
  ]

  return (
    <>
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <SubscriptionMetrics subscriptions={allSubscriptions} loading={initialLoading} />
        
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Subscriptions</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your software subscriptions</p>
          </div>
        </div>

        {initialLoading ? (
          <ContactTableSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={subscriptions}
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
            onAdd={() => {
              setEditingSubscription(null)
              setFormOpen(true)
            }}
            onEdit={(subscription) => {
              setEditingSubscription(subscription)
              setFormOpen(true)
            }}
            onDelete={handleDelete}
            filterConfig={filterConfig}
            searchPlaceholder="Search subscriptions..."
            addButtonText="Add Subscription"
            addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
          />
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingSubscription ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
              <DialogDescription>
                {editingSubscription ? 'Update subscription information.' : 'Add a new subscription to track.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="subscription_name">
                  Subscription Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subscription_name"
                  value={formData.subscription_name}
                  onChange={(e) => setFormData({ ...formData, subscription_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="vendor_id">Vendor</Label>
                  <Select
                    value={formData.vendor_id || 'none'}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData({
                          ...formData,
                          vendor_id: undefined,
                          vendor_name: undefined,
                        })
                      } else {
                        const vendor = vendors.find((v) => v.id === value)
                        setFormData({
                          ...formData,
                          vendor_id: value,
                          vendor_name: vendor?.name || undefined,
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plan_tier">Plan Tier</Label>
                  <Input
                    id="plan_tier"
                    value={formData.plan_tier}
                    onChange={(e) => setFormData({ ...formData, plan_tier: e.target.value })}
                    placeholder="Pro, Enterprise, etc."
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cost_per_period">Cost per Period</Label>
                  <Input
                    id="cost_per_period"
                    type="number"
                    step="0.01"
                    value={formData.cost_per_period || ''}
                    onChange={(e) => setFormData({ ...formData, cost_per_period: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="billing_cycle">Billing Cycle</Label>
                  <Select
                    value={formData.billing_cycle || 'monthly'}
                    onValueChange={(value) => setFormData({ ...formData, billing_cycle: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="one_time">One Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency || 'USD'}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || 'active'}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <DatePicker
                    date={formData.expiry_date ? new Date(formData.expiry_date) : undefined}
                    onDateChange={(date) => setFormData({ ...formData, expiry_date: date?.toISOString().split('T')[0] })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.subscription_name.trim()}>
                {editingSubscription ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SubscriptionDetailsModal
        subscription={selectedSubscription}
        open={detailsModalOpen}
        onOpenChange={(open) => {
          setDetailsModalOpen(open)
          if (!open) {
            setSelectedSubscription(null)
          }
        }}
        onEdit={(subscription) => {
          setSelectedSubscription(null)
          setDetailsModalOpen(false)
          setEditingSubscription(subscription)
          setFormOpen(true)
        }}
        onDelete={handleDelete}
      />
    </>
  )
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SubscriptionsPageContent />
    </Suspense>
  )
}
