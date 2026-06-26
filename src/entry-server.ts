import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import type { Register } from '@tanstack/react-router'
import type { RequestHandler } from '@tanstack/react-start/server'

const fetch = createStartHandler(defaultStreamHandler)

type ServerEntry = { fetch: RequestHandler<Register> }

function shouldRedirectTrailingSlash(request: Request, url: URL) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false
  }

  if (url.pathname === '/' || !url.pathname.endsWith('/')) {
    return false
  }

  return !url.pathname.includes('.')
}

function redirectWithoutTrailingSlash(request: Request) {
  const url = new URL(request.url)

  if (!shouldRedirectTrailingSlash(request, url)) {
    return undefined
  }

  url.pathname = url.pathname.replace(/\/+$/, '')

  return Response.redirect(url, 301)
}

export function createServerEntry(entry: ServerEntry): ServerEntry {
  return {
    async fetch(request, ...args) {
      const redirect = redirectWithoutTrailingSlash(request)

      if (redirect) {
        return redirect
      }

      return await entry.fetch(request, ...args)
    },
  }
}

export default createServerEntry({ fetch })
