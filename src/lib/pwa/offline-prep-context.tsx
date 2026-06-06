import { createContext, useContext, type ReactNode } from 'react'
import { useOfflinePrep } from '@/lib/pwa/use-offline-prep'

type OfflinePrepContextValue = ReturnType<typeof useOfflinePrep>

const OfflinePrepContext = createContext<OfflinePrepContextValue | null>(null)

export function OfflinePrepProvider({ children }: { children: ReactNode }) {
  const value = useOfflinePrep()
  return <OfflinePrepContext.Provider value={value}>{children}</OfflinePrepContext.Provider>
}

export function useOfflinePrepContext(): OfflinePrepContextValue {
  const context = useContext(OfflinePrepContext)
  if (!context) {
    throw new Error('useOfflinePrepContext must be used within OfflinePrepProvider')
  }
  return context
}

export function useOptionalOfflinePrepContext(): OfflinePrepContextValue | null {
  return useContext(OfflinePrepContext)
}
