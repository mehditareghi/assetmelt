import { createContext, useContext, type ReactNode } from 'react'

const AppVersionContext = createContext<string | null>(null)

export function AppVersionProvider({
  version,
  children,
}: Readonly<{ version: string | null; children: ReactNode }>) {
  return (
    <AppVersionContext.Provider value={version}>
      {children}
    </AppVersionContext.Provider>
  )
}

/** Version from root route loader (server via createServerFn on first load). */
export function useAppVersion() {
  return useContext(AppVersionContext)
}
