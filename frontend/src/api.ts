import type {
  UploadSessionCreateRequest,
  UploadSession,
  PresignedPart,
  UploadedPart
} from './uploadTypes'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export async function createUploadSession(req: UploadSessionCreateRequest): Promise<UploadSession> {
  const res = await fetch(`${BASE}/api/upload-sessions`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(req)
  })
  if (!res.ok) throw new Error(`createUploadSession failed: ${res.status}`)
  return res.json()
}

export async function presignParts(sessionId: string, partNumbers: number[]): Promise<PresignedPart[]> {
  const res = await fetch(`${BASE}/api/upload-sessions/${sessionId}/parts`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ partNumbers })
  })
  if (!res.ok) throw new Error(`presignParts failed: ${res.status}`)
  return res.json()
}

export async function completeUpload(sessionId: string, parts: UploadedPart[]): Promise<{ location: string }> {
  const res = await fetch(`${BASE}/api/upload-sessions/${sessionId}/complete`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ parts })
  })
  if (!res.ok) throw new Error(`completeUpload failed: ${res.status}`)
  return res.json()
}
