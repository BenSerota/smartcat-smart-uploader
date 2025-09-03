const express = require('express');
const multer = require('multer');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 9000;

// Storage setup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// In-memory storage for multipart uploads
const multipartUploads = new Map();

app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['ETag', 'x-amz-version-id']
}));
app.use(express.json());
app.use(express.raw({ type: '*/*', limit: '50mb' }));

// Health check
app.get('/minio/health/live', (req, res) => {
  res.send('OK');
});

// Create multipart upload
app.post('/:bucket/:key+', (req, res) => {
  if (req.query.uploads !== undefined) {
    const uploadId = uuidv4();
    const key = req.params.key + req.params[0];
    
    multipartUploads.set(uploadId, {
      bucket: req.params.bucket,
      key: key,
      parts: new Map(),
      createdAt: new Date()
    });
    
    res.set('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<InitiateMultipartUploadResult>
  <Bucket>${req.params.bucket}</Bucket>
  <Key>${key}</Key>
  <UploadId>${uploadId}</UploadId>
</InitiateMultipartUploadResult>`);
  } else if (req.query.uploadId) {
    // Complete multipart upload
    const uploadId = req.query.uploadId;
    const upload = multipartUploads.get(uploadId);
    
    if (!upload) {
      return res.status(404).send('Upload not found');
    }
    
    // Combine all parts
    const finalPath = path.join(uploadsDir, upload.key);
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const writeStream = fs.createWriteStream(finalPath);
    const sortedParts = Array.from(upload.parts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([_, part]) => part.data);
    
    for (const data of sortedParts) {
      writeStream.write(data);
    }
    writeStream.end();
    
    const etag = crypto.createHash('md5').update(upload.key).digest('hex');
    multipartUploads.delete(uploadId);
    
    res.set('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<CompleteMultipartUploadResult>
  <Location>http://localhost:${PORT}/${upload.bucket}/${upload.key}</Location>
  <Bucket>${upload.bucket}</Bucket>
  <Key>${upload.key}</Key>
  <ETag>"${etag}"</ETag>
</CompleteMultipartUploadResult>`);
  }
});

// Upload part
app.put('/:bucket/:key+', (req, res) => {
  const uploadId = req.query.uploadId;
  const partNumber = parseInt(req.query.partNumber);
  
  if (uploadId && partNumber) {
    // Handle multipart upload part
    const upload = multipartUploads.get(uploadId);
    if (!upload) {
      return res.status(404).send('Upload not found');
    }
    
    const etag = crypto.createHash('md5').update(req.body).digest('hex');
    upload.parts.set(partNumber, {
      etag: etag,
      size: req.body.length,
      data: req.body
    });
    
    res.set('ETag', `"${etag}"`);
    res.status(200).send();
  } else {
    // Handle regular upload
    const key = req.params.key + req.params[0];
    const filePath = path.join(uploadsDir, key);
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, req.body);
    const etag = crypto.createHash('md5').update(req.body).digest('hex');
    
    res.set('ETag', `"${etag}"`);
    res.status(200).send();
  }
});

// Get object (for testing)
app.get('/:bucket/:key+', (req, res) => {
  const key = req.params.key + req.params[0];
  const filePath = path.join(uploadsDir, key);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Not found');
  }
});

// Create bucket (mock)
app.put('/:bucket', (req, res) => {
  res.status(200).send();
});

app.listen(PORT, () => {
  console.log(`Mock S3 server running on http://localhost:${PORT}`);
  console.log('');
  console.log('✅ Mock S3 is ready for testing!');
  console.log('');
  console.log('You can now:');
  console.log('1. cd backend && npm install && npm run dev');
  console.log('2. cd frontend && npm run dev');
  console.log('3. Open http://localhost:5173 to test the uploader!');
});
