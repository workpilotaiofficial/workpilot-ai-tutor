'use client'

const DATABASE_NAME = 'neurova-study-set-sources'
const DATABASE_VERSION = 1
const STORE_NAME = 'files'

export type CachedStudySetSource = {
  documentId: string
  file: Blob
  filename: string
  mimeType: string
  cachedAt: string
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('Browser file storage is unavailable.'))
      return
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'documentId' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open browser file storage.'))
  })
}

export async function cacheStudySetSource(documentId: string, file: File) {
  const database = await openDatabase()

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put({
        documentId,
        file,
        filename: file.name,
        mimeType: file.type,
        cachedAt: new Date().toISOString(),
      } satisfies CachedStudySetSource)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not cache the source file.'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Source file caching was cancelled.'))
    })
  } finally {
    database.close()
  }
}

export async function getCachedStudySetSource(documentId: string) {
  const database = await openDatabase()

  try {
    return await new Promise<CachedStudySetSource | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).get(documentId)
      request.onsuccess = () => resolve((request.result as CachedStudySetSource | undefined) ?? null)
      request.onerror = () => reject(request.error ?? new Error('Could not read the cached source file.'))
    })
  } finally {
    database.close()
  }
}
