'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type VerticalScopeState = {
  verticalScope: 'all' | string
  setVerticalScope: (scope: 'all' | string) => void
}

export const useVerticalScope = create<VerticalScopeState>()(
  persist(
    (set) => ({
      verticalScope: 'all',
      setVerticalScope: (scope) => set({ verticalScope: scope }),
    }),
    {
      name: 'vertical-scope',
      version: 1,
    }
  )
)



