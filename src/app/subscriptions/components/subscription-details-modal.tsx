'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SubscriptionFull, SubscriptionStatus } from '@/lib/types/subscriptions'
import {
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Building2,
  Link as LinkIcon,
  CreditCard,
  RefreshCw,
  Tag,
  FileText,
  User,
} from 'lucide-react'
import { format, isPast } from 'date-fns'
import { SubscriptionIcon } from './subscription-icon'

interface SubscriptionDetailsModalProps {
  subscription: SubscriptionFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (subscription: SubscriptionFull) => void
  onDelete: (subscription: SubscriptionFull) => void
}

const statusConfig: Record<
  SubscriptionStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  active: { label: 'Active', variant: 'default' },
  expired: { label: 'Expired', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  pending: { label: 'Pending', variant: 'outline' },
  trial: { label: 'Trial', variant: 'secondary' },
}

const autoRenewalConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  enabled: { label: 'Enabled', variant: 'default' },
  disabled: { label: 'Disabled', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
}

export function SubscriptionDetailsModal({
  subscription,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: SubscriptionDetailsModalProps) {
  if (!subscription) return null

  const status = subscription.status || 'pending'
  const statusInfo = statusConfig[status] || { label: status, variant: 'outline' as const }
  const autoRenewalStatus = subscription.auto_renewal_status || 'disabled'
  const autoRenewalInfo = autoRenewalConfig[autoRenewalStatus] || { label: autoRenewalStatus, variant: 'outline' as const }

  const formatCurrency = (amount: number | null, currency: string = 'USD') => {
    if (!amount) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: subscription.currency || currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return format(new Date(date), 'MMM d, yyyy')
  }

  const isExpired = subscription.expiry_date ? isPast(new Date(subscription.expiry_date)) : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SubscriptionIcon
                iconUrl={subscription.icon_url}
                subscriptionName={subscription.subscription_name}
                size={48}
              />
              <div>
                <DialogTitle>{subscription.subscription_name}</DialogTitle>
                <DialogDescription>Subscription details and billing information</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => onEdit(subscription)} size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={() => onDelete(subscription)}
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Status & Plan</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>
                  {subscription.plan_tier && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Plan Tier:</span>
                      <Badge variant="outline">{subscription.plan_tier}</Badge>
                    </div>
                  )}
                  {subscription.category && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Category:</span>
                      <span>{subscription.category}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Auto Renewal:</span>
                    <Badge variant={autoRenewalInfo.variant}>{autoRenewalInfo.label}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Vendor & Owner</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Vendor:</span>
                    <span>
                      {subscription.vendor?.name || subscription.vendor_name || '—'}
                    </span>
                  </div>
                  {subscription.owner && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Owner:</span>
                      <span>
                        {[subscription.owner.first_name, subscription.owner.last_name]
                          .filter(Boolean)
                          .join(' ') || '—'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Billing Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Cost per Period:</span>
                    <span className="font-medium">
                      {formatCurrency(subscription.cost_per_period, subscription.currency || 'USD')}
                    </span>
                    {subscription.billing_cycle && (
                      <Badge variant="outline" className="ml-2">
                        /{subscription.billing_cycle}
                      </Badge>
                    )}
                  </div>
                  {subscription.cost_per_user && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Cost per User:</span>
                      <span className="font-medium">
                        {formatCurrency(subscription.cost_per_user, subscription.currency || 'USD')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Currency:</span>
                    <span>{subscription.currency || 'USD'}</span>
                  </div>
                  {subscription.number_of_users && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Number of Users:</span>
                      <span>{subscription.number_of_users}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Important Dates</h4>
                <div className="space-y-3 text-sm">
                  {subscription.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Start Date:</span>
                      <span>{formatDate(subscription.start_date)}</span>
                    </div>
                  )}
                  {subscription.expiry_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Expiry Date:</span>
                      <span className={isExpired ? 'text-destructive font-medium' : ''}>
                        {formatDate(subscription.expiry_date)}
                        {isExpired && ' (Expired)'}
                      </span>
                    </div>
                  )}
                  {subscription.renewal_date && (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Renewal Date:</span>
                      <span>{formatDate(subscription.renewal_date)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(subscription.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{formatDate(subscription.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(subscription.portal_url || subscription.notes) && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Additional Information</h4>
                <div className="space-y-3 text-sm">
                  {subscription.portal_url && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Portal URL:</span>
                      <a
                        href={subscription.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {subscription.portal_url}
                      </a>
                    </div>
                  )}
                  {subscription.notes && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <span className="text-muted-foreground block mb-1">Notes:</span>
                        <p className="text-sm whitespace-pre-wrap">{subscription.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

