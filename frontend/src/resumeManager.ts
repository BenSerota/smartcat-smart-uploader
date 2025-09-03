import { get, set, del, keys } from 'idb-keyval'
import type { UploadSession, UploadProgress } from './uploadTypes'
import { opfsFileExists } from './opfs'

interface StoredSession {
  session: UploadSession
  progress: UploadProgress
  filename: string
  lastUpdated: number
}

const SESSION_PREFIX = 'upload_session_'
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function saveSession(sessionId: string, session: UploadSession, progress: UploadProgress) {
  const stored: StoredSession = {
    session,
    progress,
    filename: progress.filename,
    lastUpdated: Date.now()
  }
  await set(`${SESSION_PREFIX}${sessionId}`, stored)
}

export async function getStoredSessions(): Promise<StoredSession[]> {
  const allKeys = await keys()
  const sessionKeys = allKeys.filter(k => String(k).startsWith(SESSION_PREFIX))
  const sessions: StoredSession[] = []
  
  for (const key of sessionKeys) {
    try {
      const stored = await get(key) as StoredSession
      
      // Check if session is not too old
      if (Date.now() - stored.lastUpdated < SESSION_EXPIRY_MS) {
        // Check if OPFS file still exists
        const opfsPath = ['uploads', `${stored.session.id}.bin`]
        if (await opfsFileExists(opfsPath)) {
          sessions.push(stored)
        } else {
          // Clean up orphaned session
          await del(key)
        }
      } else {
        // Clean up expired session
        await del(key)
      }
    } catch (e) {
      // Clean up corrupted data
      await del(key)
    }
  }
  
  return sessions.sort((a, b) => b.lastUpdated - a.lastUpdated)
}

export async function removeSession(sessionId: string) {
  await del(`${SESSION_PREFIX}${sessionId}`)
}

export async function updateSessionProgress(sessionId: string, progress: UploadProgress) {
  const key = `${SESSION_PREFIX}${sessionId}`
  const stored = await get(key) as StoredSession | undefined
  
  if (stored) {
    stored.progress = progress
    stored.lastUpdated = Date.now()
    await set(key, stored)
  }
}
