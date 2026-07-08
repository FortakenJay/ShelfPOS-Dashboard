const PAGE_SIZE = 1000

export async function fetchAllPages<T>(
  fetchPage: (offset: number, limit: number) => Promise<T[]>,
): Promise<T[]> {
  const all: T[] = []
  let offset = 0
  for (;;) {
    const page = await fetchPage(offset, PAGE_SIZE)
    if (!page.length) break
    all.push(...page)
    if (page.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return all
}

export async function fetchInChunks<T, TResult>(
  ids: T[],
  chunkSize: number,
  fetchChunk: (chunk: T[]) => Promise<TResult[]>,
): Promise<TResult[]> {
  if (!ids.length) return []
  const chunks: T[][] = []
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize))
  }
  const pages = await Promise.all(chunks.map((chunk) => fetchChunk(chunk)))
  return pages.flat()
}
