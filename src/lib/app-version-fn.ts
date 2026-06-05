import { createServerFn } from '@tanstack/react-start'
import { APP_VERSION } from '@/generated/app-version'

export const getAppVersion = createServerFn({ method: 'GET' }).handler(() => {
  return APP_VERSION
})
