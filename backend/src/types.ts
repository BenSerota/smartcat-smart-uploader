import { z } from 'zod'

export const CreateSessionSchema = z.object({
  filename: z.string(),
  size: z.number().int().nonnegative(),
  contentType: z.string().default('application/octet-stream'),
  desiredPartSize: z.number().int().positive().optional()
})

export const PresignPartsSchema = z.object({
  partNumbers: z.array(z.number().int().positive()).nonempty()
})

export const CompleteSchema = z.object({
  parts: z.array(z.object({
    ETag: z.string(),
    PartNumber: z.number().int().positive(),
    size: z.number().int().positive()
  })).nonempty()
})
