export function applyIdOrder<T extends { id: string }>(
  items: T[],
  orderedIds: string[],
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const next: T[] = []
  const seen = new Set<string>()
  for (const id of orderedIds) {
    const item = byId.get(id)
    if (!item || seen.has(id)) continue
    next.push(item)
    seen.add(id)
  }
  for (const item of items) {
    if (!seen.has(item.id)) next.push(item)
  }
  return next
}

export function moveIdInOrder(ids: string[], id: string, delta: number): string[] {
  const index = ids.indexOf(id)
  if (index < 0 || delta === 0) return ids
  const nextIndex = Math.max(0, Math.min(ids.length - 1, index + delta))
  if (nextIndex === index) return ids
  const next = [...ids]
  const [item] = next.splice(index, 1)
  next.splice(nextIndex, 0, item)
  return next
}

export function idsInSameOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i])
}
