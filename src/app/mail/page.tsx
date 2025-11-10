'use client'

import { useState, useMemo, useCallback } from 'react'
import { MailSidebar } from '@/components/mail/mail-sidebar'
import { EmailListHeader } from '@/components/mail/email-list-header'
import { EmailList } from '@/components/mail/email-list'
import { EmailViewerHeader } from '@/components/mail/email-viewer-header'
import { EmailViewerContent } from '@/components/mail/email-viewer-content'
import { EmailReplyInput } from '@/components/mail/email-reply-input'
import {
  mockFolders,
  mockCategories,
  mockEmails,
  mockEmailContent,
} from '@/lib/mail/mock-data'
import { Email, EmailContent } from '@/components/mail/types'

export default function MailPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('inbox')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>()
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmailId, setSelectedEmailId] = useState<string | undefined>('email-1')
  const [emails, setEmails] = useState<Email[]>(mockEmails)

  // Get selected folder
  const selectedFolder = useMemo(() => {
    return mockFolders.find((f) => f.id === selectedFolderId) || mockFolders[0]
  }, [selectedFolderId])

  // Filter emails based on folder, category, filter mode, and search
  const filteredEmails = useMemo(() => {
    let filtered = emails.filter((email) => email.folder === selectedFolderId)

    // Apply category filter if selected
    if (selectedCategoryId) {
      filtered = filtered.filter(
        (email) => email.categories?.includes(selectedCategoryId)
      )
    }

    // Apply filter mode (all/unread)
    if (filterMode === 'unread') {
      filtered = filtered.filter((email) => email.isUnread)
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (email) =>
          email.sender.name.toLowerCase().includes(query) ||
          email.subject.toLowerCase().includes(query) ||
          email.preview.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [emails, selectedFolderId, selectedCategoryId, filterMode, searchQuery])

  // Get selected email content
  const selectedEmailContent = useMemo(() => {
    if (!selectedEmailId) return null
    return mockEmailContent[selectedEmailId] || null
  }, [selectedEmailId])

  // Handle folder selection
  const handleSelectFolder = useCallback((folderId: string) => {
    setSelectedFolderId(folderId)
    setSelectedCategoryId(undefined) // Clear category when selecting folder
    setSelectedEmailId(undefined) // Clear selected email
  }, [])

  // Handle category selection
  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setSelectedFolderId('inbox') // Default to inbox when selecting category
    setSelectedEmailId(undefined) // Clear selected email
  }, [])

  // Handle email selection
  const handleSelectEmail = useCallback((emailId: string) => {
    setSelectedEmailId(emailId)
    // Mark as read
    setEmails((prev) =>
      prev.map((email) =>
        email.id === emailId ? { ...email, isUnread: false } : email
      )
    )
  }, [])

  // Handle search
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Handle reply
  const handleReply = useCallback(
    (reply: string, muteThread: boolean) => {
      if (!selectedEmailId || !reply.trim()) return

      // Simulate sending reply (in real app, this would call API)
      console.log('Reply sent:', { emailId: selectedEmailId, reply, muteThread })

      // Clear reply input (handled in component)
    },
    [selectedEmailId]
  )

  // Handle email actions
  const handleDelete = useCallback(() => {
    if (selectedEmailId) {
      setEmails((prev) => prev.filter((email) => email.id !== selectedEmailId))
      setSelectedEmailId(undefined)
    }
  }, [selectedEmailId])

  const handleArchive = useCallback(() => {
    if (selectedEmailId) {
      setEmails((prev) =>
        prev.map((email) =>
          email.id === selectedEmailId ? { ...email, folder: 'archive' } : email
        )
      )
      setSelectedEmailId(undefined)
    }
  }, [selectedEmailId])

  const handleSnooze = useCallback(() => {
    // Placeholder for snooze functionality
    console.log('Snooze clicked')
  }, [])

  // Update folder active states
  const foldersWithActive = mockFolders.map((folder) => ({
    ...folder,
    isActive: folder.id === selectedFolderId,
  }))

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex flex-1 min-w-0 overflow-hidden">
        {/* Mail Sidebar */}
        <MailSidebar
          folders={foldersWithActive}
          categories={mockCategories}
          selectedFolderId={selectedFolderId}
          selectedCategoryId={selectedCategoryId}
          onSelectFolder={handleSelectFolder}
          onSelectCategory={handleSelectCategory}
        />

        {/* Middle Panel - Email List */}
        <div className="flex flex-col w-[400px] border-r bg-background min-w-0 overflow-hidden">
          <div className="flex-shrink-0">
            <EmailListHeader
              folderName={selectedFolder.name}
              filterMode={filterMode}
              onFilterChange={setFilterMode}
              onSearchChange={handleSearchChange}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onSnooze={handleSnooze}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <EmailList
              emails={filteredEmails}
              selectedEmailId={selectedEmailId}
              onSelectEmail={handleSelectEmail}
            />
          </div>
        </div>

        {/* Right Panel - Email Viewer */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <div className="flex-shrink-0">
            <EmailViewerHeader
              email={selectedEmailContent}
              onReply={() => console.log('Reply clicked')}
              onReplyAll={() => console.log('Reply All clicked')}
              onForward={() => console.log('Forward clicked')}
            />
          </div>
          <EmailViewerContent email={selectedEmailContent} />
          <div className="flex-shrink-0">
            <EmailReplyInput
              email={selectedEmailContent}
              onSend={handleReply}
              disabled={!selectedEmailId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

