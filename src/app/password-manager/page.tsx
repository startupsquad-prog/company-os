'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import type { PasswordFull, PasswordFormData } from '@/lib/types/password-vault'
import type { CardFull, CardFormData } from '@/lib/types/password-vault'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import { createPasswordColumns } from './components/password-columns'
import { PasswordForm } from './components/password-form'
import { CardTable } from './components/card-table'
import { CardForm } from './components/card-form'
import { DocumentTable } from './components/document-table'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'


function PasswordManagerPageContent() {
  const [activeTab, setActiveTab] = useState('passwords')
  
  // Passwords state
  const [passwords, setPasswords] = useState<PasswordFull[]>([])
  const [passwordsLoading, setPasswordsLoading] = useState(true)
  const [passwordsInitialLoading, setPasswordsInitialLoading] = useState(true)
  const [passwordFormOpen, setPasswordFormOpen] = useState(false)
  const [editingPassword, setEditingPassword] = useState<PasswordFull | null>(null)
  const [passwordPage, setPasswordPage] = useState(1)
  const [passwordPageSize, setPasswordPageSize] = useState(10)
  const [passwordPageCount, setPasswordPageCount] = useState(0)
  const [passwordSorting, setPasswordSorting] = useState<SortingState>([])
  const [passwordFilters, setPasswordFilters] = useState<ColumnFiltersState>([])
  const [passwordSearch, setPasswordSearch] = useState('')

  // Cards state
  const [cards, setCards] = useState<CardFull[]>([])
  const [cardsLoading, setCardsLoading] = useState(true)
  const [cardsInitialLoading, setCardsInitialLoading] = useState(true)
  const [cardFormOpen, setCardFormOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CardFull | null>(null)
  const [cardPage, setCardPage] = useState(1)
  const [cardPageSize, setCardPageSize] = useState(12)
  const [cardPageCount, setCardPageCount] = useState(0)
  const [cardSorting, setCardSorting] = useState<SortingState>([])
  const [cardFilters, setCardFilters] = useState<ColumnFiltersState>([])
  const [cardSearch, setCardSearch] = useState('')

  // Fetch passwords
  const fetchPasswords = useCallback(async () => {
    try {
      setPasswordsLoading(true)

      const params = new URLSearchParams({
        page: passwordPage.toString(),
        pageSize: passwordPageSize.toString(),
        ...(passwordSearch ? { search: passwordSearch } : {}),
      })

      // Add category filter
      const categoryFilter = passwordFilters.find((f) => f.id === 'category')
      if (categoryFilter && categoryFilter.value) {
        const values = Array.isArray(categoryFilter.value) ? categoryFilter.value : [categoryFilter.value]
        params.append('category', values.join(','))
      }

      // Add sorting
      if (passwordSorting.length > 0) {
        params.append('sortField', passwordSorting[0].id || 'created_at')
        params.append('sortDirection', passwordSorting[0].desc ? 'desc' : 'asc')
      }

      const response = await fetch(`/api/unified/passwords?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      setPasswords(result.data || [])
      setPasswordPageCount(result.totalPages || 0)
    } catch (error: any) {
      console.error('Error fetching passwords:', error)
      toast.error(`Failed to load passwords: ${error.message || 'Unknown error'}`)
      setPasswords([])
      setPasswordPageCount(0)
    } finally {
      setPasswordsLoading(false)
      setPasswordsInitialLoading(false)
    }
  }, [passwordPage, passwordPageSize, passwordSorting, passwordFilters, passwordSearch])

  // Fetch cards
  const fetchCards = useCallback(async () => {
    try {
      setCardsLoading(true)

      const params = new URLSearchParams({
        page: cardPage.toString(),
        pageSize: cardPageSize.toString(),
        ...(cardSearch ? { search: cardSearch } : {}),
      })

      // Add filters
      const categoryFilter = cardFilters.find((f) => f.id === 'category')
      if (categoryFilter && categoryFilter.value) {
        const values = Array.isArray(categoryFilter.value) ? categoryFilter.value : [categoryFilter.value]
        params.append('category', values.join(','))
      }

      // Add sorting
      if (cardSorting.length > 0) {
        params.append('sortField', cardSorting[0].id || 'created_at')
        params.append('sortDirection', cardSorting[0].desc ? 'desc' : 'asc')
      }

      const response = await fetch(`/api/unified/cards?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      setCards(result.data || [])
      setCardPageCount(result.totalPages || 0)
    } catch (error: any) {
      console.error('Error fetching cards:', error)
      toast.error(`Failed to load cards: ${error.message || 'Unknown error'}`)
      setCards([])
      setCardPageCount(0)
    } finally {
      setCardsLoading(false)
      setCardsInitialLoading(false)
    }
  }, [cardPage, cardPageSize, cardSorting, cardFilters, cardSearch])

  useEffect(() => {
    if (activeTab === 'passwords') {
      fetchPasswords()
    } else if (activeTab === 'cards') {
      fetchCards()
    }
  }, [activeTab, fetchPasswords, fetchCards])

  // Handle password create/update
  const handlePasswordSubmit = async (data: PasswordFormData) => {
    try {
      const url = '/api/unified/passwords'
      const method = editingPassword ? 'PATCH' : 'POST'

      const payload = {
        ...(editingPassword ? { id: editingPassword.id } : {}),
        ...data,
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

      toast.success(editingPassword ? 'Password updated successfully' : 'Password created successfully')
      setPasswordFormOpen(false)
      setEditingPassword(null)
      await fetchPasswords()
    } catch (error: any) {
      console.error('Error saving password:', error)
      toast.error(error.message || 'Failed to save password')
      throw error
    }
  }

  // Handle password delete
  const handlePasswordDelete = async (password: PasswordFull) => {
    if (!confirm(`Are you sure you want to delete ${password.title}?`)) return

    try {
      const response = await fetch(`/api/unified/passwords?id=${password.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      toast.success('Password deleted successfully')
      await fetchPasswords()
    } catch (error: any) {
      console.error('Error deleting password:', error)
      toast.error(`Failed to delete password: ${error.message || 'Unknown error'}`)
    }
  }

  // Handle card create/update
  const handleCardSubmit = async (data: CardFormData) => {
    try {
      const url = '/api/unified/cards'
      const method = editingCard ? 'PATCH' : 'POST'

      const payload = {
        ...(editingCard ? { id: editingCard.id } : {}),
        ...data,
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

      toast.success(editingCard ? 'Card updated successfully' : 'Card created successfully')
      setCardFormOpen(false)
      setEditingCard(null)
      await fetchCards()
    } catch (error: any) {
      console.error('Error saving card:', error)
      toast.error(error.message || 'Failed to save card')
      throw error
    }
  }

  // Handle card delete
  const handleCardDelete = async (card: CardFull) => {
    if (!confirm(`Are you sure you want to delete ${card.title}?`)) return

    try {
      const response = await fetch(`/api/unified/cards?id=${card.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      toast.success('Card deleted successfully')
      await fetchCards()
    } catch (error: any) {
      console.error('Error deleting card:', error)
      toast.error(`Failed to delete card: ${error.message || 'Unknown error'}`)
    }
  }

  // Create password columns
  const passwordColumns = createPasswordColumns({
    onEdit: (password) => {
      setEditingPassword(password)
      setPasswordFormOpen(true)
    },
    onDelete: handlePasswordDelete,
  })

  // Filter config for passwords
  const passwordFilterConfig = [
    {
      columnId: 'category',
      title: 'Category',
      options: [
        { label: 'Work', value: 'Work' },
        { label: 'Personal', value: 'Personal' },
        { label: 'Banking', value: 'Banking' },
        { label: 'Social Media', value: 'Social Media' },
      ],
    },
  ]

  return (
    <>
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Password Manager</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your passwords, cards, and documents</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0 overflow-hidden password-manager-tabs">
          <div className="flex items-center justify-between flex-shrink-0" style={{ marginBottom: 0, paddingBottom: 0, height: 'auto', minHeight: 'auto' }}>
            <TabsList className="w-fit" style={{ marginBottom: 0 }}>
              <TabsTrigger value="passwords">Passwords</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            {activeTab === 'cards' && (
              <Button
                onClick={() => {
                  setEditingCard(null)
                  setCardFormOpen(true)
                }}
                className="ml-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            )}
          </div>

          <TabsContent 
            value="passwords" 
            className="!mt-0 !pt-0" 
            style={{ display: 'flex', flexDirection: 'column', flex: '1', minHeight: 0, height: '100%', marginTop: 0, paddingTop: 0 }}
          >
            {passwordsInitialLoading ? (
              <ContactTableSkeleton />
            ) : (
              <DataTable
                columns={passwordColumns}
                data={passwords}
                pageCount={passwordPageCount}
                onPaginationChange={(p, s) => {
                  setPasswordPage(p)
                  setPasswordPageSize(s)
                }}
                onSortingChange={setPasswordSorting}
                onFilterChange={setPasswordFilters}
                onSearchChange={setPasswordSearch}
                loading={passwordsLoading}
                initialLoading={passwordsInitialLoading}
                onAdd={() => {
                  setEditingPassword(null)
                  setPasswordFormOpen(true)
                }}
                onEdit={(password) => {
                  setEditingPassword(password)
                  setPasswordFormOpen(true)
                }}
                onDelete={handlePasswordDelete}
                filterConfig={passwordFilterConfig}
                searchPlaceholder="Search passwords..."
                addButtonText="Add Password"
                addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
              />
            )}
          </TabsContent>

          <TabsContent 
            value="cards" 
            className="flex-1 overflow-y-auto min-h-0 mt-0" 
            style={{ marginTop: 0, paddingTop: 0 }}
          >
            {cardsInitialLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading cards...</div>
              </div>
            ) : (
              <CardTable
                cards={cards}
                onEdit={(card) => {
                  setEditingCard(card)
                  setCardFormOpen(true)
                }}
                onDelete={handleCardDelete}
              />
            )}
          </TabsContent>

          <TabsContent 
            value="documents" 
            className="flex-1 overflow-y-auto min-h-0 mt-0"
          >
            <DocumentTable />
          </TabsContent>
        </Tabs>
      </div>

      <PasswordForm
        password={editingPassword}
        open={passwordFormOpen}
        onOpenChange={(open) => {
          setPasswordFormOpen(open)
          if (!open) {
            setEditingPassword(null)
          }
        }}
        onSubmit={handlePasswordSubmit}
      />

      <CardForm
        card={editingCard}
        open={cardFormOpen}
        onOpenChange={(open) => {
          setCardFormOpen(open)
          if (!open) {
            setEditingCard(null)
          }
        }}
        onSubmit={handleCardSubmit}
      />
    </>
  )
}

export default function PasswordManagerPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PasswordManagerPageContent />
    </Suspense>
  )
}

