import { create } from 'zustand'
import type { UploadItem, UploadProgress } from './uploadTypes'
import { mockUploader, type MockUploadSession } from './mockUploader'

interface MockUploadStore {
  uploads: Map<string, UploadItem>
  
  // Actions
  initMockUploader: () => void
  addFiles: (files: File[]) => Promise<void>
  updateProgress: (sessionId: string, progress: UploadProgress) => void
  pauseUpload: (sessionId: string) => void
  resumeUpload: (sessionId: string) => void
  cancelUpload: (sessionId: string) => void
  removeUpload: (sessionId: string) => void
  
  // Getters
  getUploads: () => UploadItem[]
}

export const useMockUploadStore = create<MockUploadStore>((set, get) => ({
  uploads: new Map(),
  
  initMockUploader: () => {
    mockUploader.setCallbacks({
      onProgress: (sessionId: string, progress: UploadProgress) => {
        get().updateProgress(sessionId, progress)
      },
      onComplete: (sessionId: string, progress: UploadProgress) => {
        get().updateProgress(sessionId, progress)
        
        // Clean up completed upload after 30 seconds
        setTimeout(() => {
          get().removeUpload(sessionId)
        }, 30000)
      },
      onError: (sessionId: string, error: string) => {
        const upload = get().uploads.get(sessionId)
        if (upload) {
          set((state) => {
            const newUploads = new Map(state.uploads)
            newUploads.set(sessionId, { ...upload, error })
            return { uploads: newUploads }
          })
        }
      }
    })
  },
  
  addFiles: async (files: File[]) => {
    for (const file of files) {
      try {
        // Create mock session
        const sessionId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const session: MockUploadSession = {
          id: sessionId,
          filename: file.name,
          size: file.size,
          contentType: file.type || 'application/octet-stream'
        }
        
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
        
        // Start mock upload
        mockUploader.startUpload(session)
        
      } catch (error) {
      }
    }
  },
  
  updateProgress: (sessionId: string, progress: UploadProgress) => {
    set((state) => {
      const upload = state.uploads.get(sessionId)
      if (!upload) {
        return state
      }
      
      const newUploads = new Map(state.uploads)
      newUploads.set(sessionId, { ...upload, progress })
      return { uploads: newUploads }
    })
  },
  
  pauseUpload: (sessionId: string) => {
    const upload = get().uploads.get(sessionId)
    if (upload) {
      mockUploader.pauseUpload(sessionId)
    }
  },
  
  resumeUpload: (sessionId: string) => {
    const upload = get().uploads.get(sessionId)
    if (upload) {
      const session: MockUploadSession = {
        id: sessionId,
        filename: upload.progress.filename,
        size: upload.progress.totalBytes,
        contentType: upload.file.type || 'application/octet-stream'
      }
      mockUploader.resumeUpload(sessionId, session)
    }
  },
  
  cancelUpload: (sessionId: string) => {
    mockUploader.cancelUpload(sessionId)
    get().removeUpload(sessionId)
  },
  
  removeUpload: (sessionId: string) => {
    set((state) => {
      const newUploads = new Map(state.uploads)
      newUploads.delete(sessionId)
      return { uploads: newUploads }
    })
  },
  
  getUploads: () => {
    return Array.from(get().uploads.values())
  }
}))
