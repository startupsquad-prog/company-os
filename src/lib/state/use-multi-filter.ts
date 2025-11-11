'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type MultiFilterState = {
  selectedVertical: 'all' | string | null
  selectedDepartment: 'all' | string | null
  selectedEnterprise: 'company-os' | null
  setSelectedVertical: (vertical: 'all' | string | null) => void
  setSelectedDepartment: (department: 'all' | string | null) => void
  setSelectedEnterprise: (enterprise: 'company-os' | null) => void
  resetFilters: () => void
}

const defaultState = {
  selectedVertical: 'all' as const,
  selectedDepartment: 'all' as const,
  selectedEnterprise: 'company-os' as const,
}

export const useMultiFilter = create<MultiFilterState>()(
  persist(
    (set) => ({
      ...defaultState,
      setSelectedVertical: (vertical) => set({ selectedVertical: vertical }),
      setSelectedDepartment: (department) => set({ selectedDepartment: department }),
      setSelectedEnterprise: (enterprise) => set({ selectedEnterprise: enterprise }),
      resetFilters: () => set(defaultState),
    }),
    {
      name: 'multi-filter',
      version: 1,
    }
  )
)





