import type { BookData } from './types'
import { sampleBook } from './sampleBook'

const DEFAULT_SOURCE = 'sample'

export async function loadBookData(): Promise<BookData> {
  const url = import.meta.env.VITE_BOOK_URL as string | undefined
  const source = (import.meta.env.VITE_BOOK_SOURCE as string | undefined) ?? DEFAULT_SOURCE

  if (!url || source === 'sample') {
    return sampleBook
  }

  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Failed to fetch book data: ${response.status}`)
    }
    const data = (await response.json()) as BookData
    const pages = [...data.pages].sort((a, b) => a.pageNo - b.pageNo)
    return { ...data, pages }
  } catch (error) {
    console.warn('Falling back to sample data.', error)
    return sampleBook
  }
}
