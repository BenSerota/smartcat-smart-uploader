"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const nanoid_1 = require("nanoid");
const s3_1 = require("./s3");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const types_1 = require("./types");
const sessions_1 = require("./sessions");
const client_s3_2 = require("@aws-sdk/client-s3");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({ limit: '2mb' }));
const BUCKET = process.env.S3_BUCKET;
if (!BUCKET) {
    throw new Error('S3_BUCKET env var required');
}
const PREFIX = process.env.S3_KEY_PREFIX || 'smartcat/uploads';
const DEFAULT_PART_SIZE = Number(process.env.PART_SIZE_BYTES || 8 * 1024 * 1024);
app.post('/api/upload-sessions', async (req, res) => {
    const parse = types_1.CreateSessionSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json(parse.error.flatten());
    const { filename, size, contentType, desiredPartSize } = parse.data;
    const id = (0, nanoid_1.nanoid)(12);
    const key = `${PREFIX}/${id}/${encodeURIComponent(filename)}`;
    const partSize = Math.max(DEFAULT_PART_SIZE, desiredPartSize || DEFAULT_PART_SIZE);
    const cmu = await s3_1.s3.send(new client_s3_1.CreateMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType
    }));
    const uploadId = cmu.UploadId;
    const totalParts = Math.ceil(size / partSize);
    const toSign = Array.from({ length: Math.min(10, totalParts) }, (_, i) => i + 1);
    const presignedParts = await Promise.all(toSign.map(async (partNumber) => {
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3, new client_s3_2.UploadPartCommand({
            Bucket: BUCKET,
            Key: key,
            PartNumber: partNumber,
            UploadId: uploadId
        }), { expiresIn: 3600 });
        return { partNumber, url, expiresAt: Date.now() + 3600 * 1000 };
    }));
    const record = {
        id, bucket: BUCKET, key, uploadId,
        filename, size, partSize,
        createdAt: Date.now(),
        parts: {}
    };
    (0, sessions_1.putSession)(record);
    res.json({
        id, bucket: BUCKET, key, uploadId, size, partSize, createdAt: record.createdAt,
        presignedParts
    });
});
app.post('/api/upload-sessions/:id/parts', async (req, res) => {
    const id = req.params.id;
    const s = (0, sessions_1.getSession)(id);
    if (!s)
        return res.status(404).json({ error: 'not found' });
    const parse = types_1.PresignPartsSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json(parse.error.flatten());
    const { partNumbers } = parse.data;
    const unique = [...new Set(partNumbers)];
    const presignedParts = await Promise.all(unique.map(async (partNumber) => {
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3, new client_s3_2.UploadPartCommand({
            Bucket: s.bucket,
            Key: s.key,
            PartNumber: partNumber,
            UploadId: s.uploadId
        }), { expiresIn: 3600 });
        return { partNumber, url, expiresAt: Date.now() + 3600 * 1000 };
    }));
    res.json(presignedParts);
});
app.post('/api/upload-sessions/:id/complete', async (req, res) => {
    const id = req.params.id;
    const s = (0, sessions_1.getSession)(id);
    if (!s)
        return res.status(404).json({ error: 'not found' });
    const parse = types_1.CompleteSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json(parse.error.flatten());
    const parts = parse.data.parts
        .sort((a, b) => a.PartNumber - b.PartNumber)
        .map((p) => ({ ETag: p.ETag, PartNumber: p.PartNumber }));
    const done = await s3_1.s3.send(new client_s3_1.CompleteMultipartUploadCommand({
        Bucket: s.bucket,
        Key: s.key,
        UploadId: s.uploadId,
        MultipartUpload: { Parts: parts }
    }));
    (0, sessions_1.deleteSession)(id);
    res.json({ location: `s3://${s.bucket}/${s.key}`, eTag: done.ETag });
});
app.get('/api/upload-sessions/:id/status', async (req, res) => {
    const id = req.params.id;
    const s = (0, sessions_1.getSession)(id);
    if (!s)
        return res.status(404).json({ error: 'not found' });
    const resp = await s3_1.s3.send(new client_s3_1.ListPartsCommand({
        Bucket: s.bucket, Key: s.key, UploadId: s.uploadId
    }));
    res.json({
        id,
        key: s.key,
        uploadId: s.uploadId,
        parts: (resp.Parts || []).map(p => ({
            ETag: p.ETag,
            PartNumber: p.PartNumber,
            Size: p.Size
        }))
    });
});
const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
    console.log('Uploader backend listening on :' + port);
});
