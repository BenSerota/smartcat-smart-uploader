export type UploadSessionCreateRequest = {
  filename: string
  size: number
  contentType: string
  desiredPartSize?: number
}

export type PresignedPart = {
  partNumber: number
  url: string
  expiresAt: number
}

export type UploadSession = {
  id: string
  bucket: string
  key: string
  uploadId: string
  size: number
  partSize: number
  createdAt: number
  presignedParts: PresignedPart[]
}

export type UploadedPart = {
  ETag: string
  PartNumber: number
  size: number
}

export type UploadProgress = {
  sessionId: string
  filename: string
  bytesUploaded: number
  totalBytes: number
  percent: number
  speedBps: number
  etaSeconds: number | null
  lastPartCompleted?: UploadedPart
  state: 'preparing' | 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled'
  error?: string
  startedAt: number
}

export type UploadItem = {
  file: File
  sessionId?: string
  progress?: UploadProgress
  error?: string
}
