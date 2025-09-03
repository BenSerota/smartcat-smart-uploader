import { useEffect, useMemo, useRef, useState } from 'react'
import { createUploadSession } from './api'
import type { UploadProgress } from './uploadTypes'
import { stageFileToOPFS, type OPFSRef } from './opfs'

type WorkerPort = MessagePort & { _sc?: true }

export function useUploader() {
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const worker = useMemo(() => {
    try {
      const sw = new SharedWorker(new URL('./uploader.sharedworker.ts', import.meta.url), { type: 'module', name: 'smartcat-uploader' })
      return sw
    } catch {
      const dw = new Worker(new URL('./uploader.sharedworker.ts', import.meta.url), { type: 'module', name: 'smartcat-uploader' }) as any
      return { port: dw }
    }
  }, [])

  useEffect(() => {
    const port: WorkerPort = worker.port as WorkerPort
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data
      if (data?.type === 'upload-progress') {
        setProgress(data.progress)
      } else if (data?.type === 'upload-error') {
        setError(data.error || 'Unknown error')
      } else if (data?.type === 'upload-complete') {
        setProgress(data.progress)
      }
    }
    port.start?.()
    port.addEventListener('message', onMessage)
    return () => port.removeEventListener('message', onMessage)
  }, [worker])

  async function addFile(file: File) {
    setError(null)
    const session = await createUploadSession({
      filename: file.name,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
    })
    setSessionId(session.id)

    const ref: OPFSRef = await stageFileToOPFS(session.id, file)

    const port: WorkerPort = worker.port as WorkerPort
    port.postMessage({
      type: 'start-upload',
      session,
      ref
    })
  }

  function pause() {
    if (!sessionId) return
    const port: WorkerPort = worker.port as WorkerPort
    port.postMessage({ type: 'pause-upload', sessionId })
  }

  function resume() {
    if (!sessionId) return
    const port: WorkerPort = worker.port as WorkerPort
    port.postMessage({ type: 'resume-upload', sessionId })
  }

  function cancel() {
    if (!sessionId) return
    const port: WorkerPort = worker.port as WorkerPort
    port.postMessage({ type: 'cancel-upload', sessionId })
  }

  return { addFile, pause, resume, cancel, progress, error, sessionId }
}
