import { create } from 'zustand'
import type { UploadItem, UploadProgress } from './uploadTypes'
import { createUploadSession } from './api'
import { stageFileToOPFS, type OPFSRef, removeFromOPFS } from './opfs'
import { showToast } from './toastStore'
import { saveSession, updateSessionProgress, removeSession, getStoredSessions } from './resumeManager'

type WorkerPort = MessagePort & { _sc?: true }

interface UploadStore {
  uploads: Map<string, UploadItem>
  worker: SharedWorker | { port: Worker } | null
  
  // Actions
  initWorker: () => void
  addFiles: (files: File[]) => Promise<void>
  updateProgress: (sessionId: string, progress: UploadProgress) => void
  pauseUpload: (sessionId: string) => void
  resumeUpload: (sessionId: string) => void
  cancelUpload: (sessionId: string) => void
  removeUpload: (sessionId: string) => void
  resumeStoredSessions: () => Promise<void>
  
  // Getters
  getUploads: () => UploadItem[]
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  uploads: new Map(),
  worker: null,
  
  initWorker: () => {
    try {
      const sw = new SharedWorker(
        new URL('./uploader.sharedworker.ts', import.meta.url), 
        { type: 'module', name: 'smartcat-uploader' }
      )
      set({ worker: sw })
      
      const port: WorkerPort = sw.port as WorkerPort
      port.start?.()
      
      port.addEventListener('message', (ev: MessageEvent) => {
        const data = ev.data
        if (data?.type === 'upload-progress') {
          get().updateProgress(data.progress.sessionId, data.progress)
        } else if (data?.type === 'upload-error') {
          const sessionId = data.sessionId || data.progress?.sessionId
          if (sessionId) {
            const upload = get().uploads.get(sessionId)
            if (upload) {
              set((state) => {
                const newUploads = new Map(state.uploads)
                newUploads.set(sessionId, { ...upload, error: data.error })
                return { uploads: newUploads }
              })
              showToast.error(`Upload failed: ${data.error}`)
            }
          }
        } else if (data?.type === 'upload-complete') {
          const progress = data.progress
          get().updateProgress(progress.sessionId, progress)
          showToast.success(`Upload complete: ${progress.filename}`)
        }
      })
    } catch {
      // Fallback to dedicated worker
      const dw = new Worker(
        new URL('./uploader.sharedworker.ts', import.meta.url), 
        { type: 'module' }
      ) as any
      set({ worker: { port: dw } })
      
      dw.addEventListener('message', (ev: MessageEvent) => {
        const data = ev.data
        if (data?.type === 'upload-progress') {
          get().updateProgress(data.progress.sessionId, data.progress)
        } else if (data?.type === 'upload-error') {
          const sessionId = data.sessionId || data.progress?.sessionId
          if (sessionId) {
            const upload = get().uploads.get(sessionId)
            if (upload) {
              set((state) => {
                const newUploads = new Map(state.uploads)
                newUploads.set(sessionId, { ...upload, error: data.error })
                return { uploads: newUploads }
              })
              showToast.error(`Upload failed: ${data.error}`)
            }
          }
        } else if (data?.type === 'upload-complete') {
          const progress = data.progress
          get().updateProgress(progress.sessionId, progress)
          showToast.success(`Upload complete: ${progress.filename}`)
        }
      })
    }
  },
  
  addFiles: async (files: File[]) => {
    const worker = get().worker
    if (!worker) {
      get().initWorker()
    }
    
    for (const file of files) {
      try {
        // Create session
        const session = await createUploadSession({
          filename: file.name,
          size: file.size,
          contentType: file.type || 'application/octet-stream',
        })
        
        // Add to store with preparing state
        const uploadItem: UploadItem = {
          file,
          sessionId: session.id,
          progress: {
            sessionId: session.id,
            filename: file.name,
            bytesUploaded: 0,
            totalBytes: file.size,
            percent: 0,
            speedBps: 0,
            etaSeconds: null,
            state: 'preparing',
            startedAt: Date.now()
          }
        }
        
        set((state) => {
          const newUploads = new Map(state.uploads)
          newUploads.set(session.id, uploadItem)
          return { uploads: newUploads }
        })
        
        // Stage to OPFS
        const ref: OPFSRef = await stageFileToOPFS(session.id, file)
        
        // Start upload
        const port: WorkerPort = (get().worker as any).port
        port.postMessage({
          type: 'start-upload',
          session: { ...session, filename: file.name },
          ref
        })
        
        // Save session to IndexedDB
        await saveSession(session.id, session, uploadItem.progress!)
        
        showToast.info(`Starting upload: ${file.name}`)
      } catch (error) {
        showToast.error(`Failed to start upload for ${file.name}: ${error}`)
      }
    }
  },
  
  updateProgress: (sessionId: string, progress: UploadProgress) => {
    set((state) => {
      const upload = state.uploads.get(sessionId)
      if (!upload) return state
      
      const newUploads = new Map(state.uploads)
      newUploads.set(sessionId, { ...upload, progress })
      return { uploads: newUploads }
    })
    
    // Save progress to IndexedDB for resumption
    const upload = get().uploads.get(sessionId)
    if (upload && upload.sessionId && progress.state !== 'completed' && progress.state !== 'cancelled') {
      const session = {
        id: sessionId,
        bucket: '', // These will be filled from stored session
        key: '',
        uploadId: '',
        size: upload.file.size,
        partSize: 8 * 1024 * 1024,
        createdAt: progress.startedAt,
        presignedParts: []
      }
      updateSessionProgress(sessionId, progress).catch(() => {})
    }
  },
  
  pauseUpload: (sessionId: string) => {
    const port: WorkerPort = (get().worker as any)?.port
    if (port) {
      port.postMessage({ type: 'pause-upload', sessionId })
    }
  },
  
  resumeUpload: (sessionId: string) => {
    const port: WorkerPort = (get().worker as any)?.port
    if (port) {
      port.postMessage({ type: 'resume-upload', sessionId })
    }
  },
  
  cancelUpload: (sessionId: string) => {
    const port: WorkerPort = (get().worker as any)?.port
    if (port) {
      port.postMessage({ type: 'cancel-upload', sessionId })
    }
    
    // Clean up OPFS
    removeFromOPFS(sessionId).catch(() => {})
    
    // Remove from store
    get().removeUpload(sessionId)
    showToast.info('Upload cancelled')
  },
  
  removeUpload: (sessionId: string) => {
    set((state) => {
      const newUploads = new Map(state.uploads)
      newUploads.delete(sessionId)
      return { uploads: newUploads }
    })
    
    // Remove from IndexedDB
    removeSession(sessionId).catch(() => {})
  },
  
  resumeStoredSessions: async () => {
    try {
      const storedSessions = await getStoredSessions()
      
      for (const stored of storedSessions) {
        // Only resume if not already in active uploads
        if (!get().uploads.has(stored.session.id)) {
          // Create a placeholder file object
          const file = new File([], stored.filename, { type: 'application/octet-stream' })
          
          const uploadItem: UploadItem = {
            file,
            sessionId: stored.session.id,
            progress: {
              ...stored.progress,
              state: 'paused' // Start in paused state
            }
          }
          
          set((state) => {
            const newUploads = new Map(state.uploads)
            newUploads.set(stored.session.id, uploadItem)
            return { uploads: newUploads }
          })
          
          // Tell worker to resume
          const port: WorkerPort = (get().worker as any)?.port
          if (port) {
            port.postMessage({
              type: 'resume-session',
              session: stored.session,
              ref: { kind: 'opfs', path: ['uploads', `${stored.session.id}.bin`] }
            })
          }
          
          showToast.info(`Resuming upload: ${stored.filename}`)
        }
      }
    } catch (error) {
      console.error('Failed to resume stored sessions:', error)
    }
  },
  
  getUploads: () => {
    return Array.from(get().uploads.values())
  }
}))
