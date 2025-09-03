import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { nanoid } from 'nanoid'
import { s3 } from './s3'
import {
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  ListPartsCommand,
  type CompletedPart
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { CreateSessionSchema, PresignPartsSchema, CompleteSchema } from './types'
import { putSession, getSession, deleteSession, type SessionRecord } from './sessions'
import { UploadPartCommand } from '@aws-sdk/client-s3'

const app = express()
app.use(cors({ origin: true }))
app.use(express.json({ limit: '2mb' }))

const BUCKET = process.env.S3_BUCKET!
if (!BUCKET) {
  throw new Error('S3_BUCKET env var required')
}
const PREFIX = process.env.S3_KEY_PREFIX || 'smartcat/uploads'
const DEFAULT_PART_SIZE = Number(process.env.PART_SIZE_BYTES || 8 * 1024 * 1024)

app.post('/api/upload-sessions', async (req, res) => {
  const parse = CreateSessionSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())

  const { filename, size, contentType, desiredPartSize } = parse.data
  const id = nanoid(12)
  const key = `${PREFIX}/${id}/${encodeURIComponent(filename)}`
  const partSize = Math.max(DEFAULT_PART_SIZE, desiredPartSize || DEFAULT_PART_SIZE)

  const cmu = await s3.send(new CreateMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType
  }))

  const uploadId = cmu.UploadId!
  const totalParts = Math.ceil(size / partSize)

  const toSign = Array.from({ length: Math.min(10, totalParts) }, (_, i) => i + 1)
  const presignedParts = await Promise.all(toSign.map(async (partNumber) => {
    const url = await getSignedUrl(s3, new UploadPartCommand({
      Bucket: BUCKET,
      Key: key,
      PartNumber: partNumber,
      UploadId: uploadId
    }), { expiresIn: 3600 })
    return { partNumber, url, expiresAt: Date.now() + 3600 * 1000 }
  }))

  const record: SessionRecord = {
    id, bucket: BUCKET, key, uploadId,
    filename, size, partSize,
    createdAt: Date.now(),
    parts: {}
  }
  putSession(record)

  res.json({
    id, bucket: BUCKET, key, uploadId, size, partSize, createdAt: record.createdAt,
    presignedParts
  })
})

app.post('/api/upload-sessions/:id/parts', async (req, res) => {
  const id = req.params.id
  const s = getSession(id)
  if (!s) return res.status(404).json({ error: 'not found' })

  const parse = PresignPartsSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())
  const { partNumbers } = parse.data

  const unique = [...new Set(partNumbers)]
  const presignedParts = await Promise.all(unique.map(async (partNumber) => {
    const url = await getSignedUrl(s3, new UploadPartCommand({
      Bucket: s.bucket,
      Key: s.key,
      PartNumber: partNumber,
      UploadId: s.uploadId
    }), { expiresIn: 3600 })
    return { partNumber, url, expiresAt: Date.now() + 3600 * 1000 }
  }))

  res.json(presignedParts)
})

app.post('/api/upload-sessions/:id/complete', async (req, res) => {
  const id = req.params.id
  const s = getSession(id)
  if (!s) return res.status(404).json({ error: 'not found' })

  const parse = CompleteSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())

  const parts = parse.data.parts
    .sort((a, b) => a.PartNumber - b.PartNumber)
    .map((p) => ({ ETag: p.ETag, PartNumber: p.PartNumber }))

  const done = await s3.send(new CompleteMultipartUploadCommand({
    Bucket: s.bucket,
    Key: s.key,
    UploadId: s.uploadId,
    MultipartUpload: { Parts: parts }
  }))

  deleteSession(id)

  res.json({ location: `s3://${s.bucket}/${s.key}`, eTag: done.ETag })
})

app.get('/api/upload-sessions/:id/status', async (req, res) => {
  const id = req.params.id
  const s = getSession(id)
  if (!s) return res.status(404).json({ error: 'not found' })

  const resp = await s3.send(new ListPartsCommand({
    Bucket: s.bucket, Key: s.key, UploadId: s.uploadId
  }))

  res.json({
    id,
    key: s.key,
    uploadId: s.uploadId,
    parts: (resp.Parts || []).map(p => ({
      ETag: p.ETag,
      PartNumber: p.PartNumber,
      Size: p.Size
    }))
  })
})

const port = Number(process.env.PORT || 4000)
app.listen(port, () => {
  console.log('Uploader backend listening on :' + port)
})
