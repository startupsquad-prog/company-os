'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type GroupScopeState = {
  selectedGroup: string | 'all'
  setSelectedGroup: (group: string | 'all') => void
}

export const useGroupScope = create<GroupScopeState>()(
  persist(
    (set) => ({
      selectedGroup: 'all',
      setSelectedGroup: (group) => set({ selectedGroup: group }),
    }),
    {
      name: 'group-scope',
      version: 1,
    }
  )
)


