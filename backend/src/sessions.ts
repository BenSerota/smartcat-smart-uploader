export type SessionRecord = {
  id: string
  bucket: string
  key: string
  uploadId: string
  filename: string
  size: number
  partSize: number
  createdAt: number
  parts: { [partNumber: number]: { ETag: string, size: number } }
}

const store = new Map<string, SessionRecord>()

export function putSession(x: SessionRecord) {
  store.set(x.id, x)
}

export function getSession(id: string) {
  return store.get(id) || null
}

export function deleteSession(id: string) {
  store.delete(id)
}
