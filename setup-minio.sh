#!/bin/bash

echo "🚀 Setting up MinIO for Smartcat Uploader POC..."

# Start MinIO with Docker Compose
echo "📦 Starting MinIO container..."
docker-compose up -d

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to start..."
sleep 5

# Install MinIO client (mc) if not already installed
if ! command -v mc &> /dev/null; then
    echo "📥 Installing MinIO client..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install minio/stable/mc
    else
        echo "Please install MinIO client manually: https://min.io/docs/minio/linux/reference/minio-mc.html"
    fi
fi

# Configure MinIO client
echo "🔧 Configuring MinIO client..."
mc alias set local http://localhost:9000 minioadmin minioadmin

# Create the test bucket
echo "🪣 Creating test-bucket..."
mc mb local/test-bucket

# Set bucket policy to allow presigned URLs
echo "🔓 Setting bucket policy..."
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::test-bucket/*"
    }
  ]
}
EOF

mc anonymous set-json /tmp/bucket-policy.json local/test-bucket
rm /tmp/bucket-policy.json

echo "✅ MinIO setup complete!"
echo ""
echo "📊 MinIO Console: http://localhost:9001"
echo "   Username: minioadmin"
echo "   Password: minioadmin"
echo ""
echo "🔗 S3 API Endpoint: http://localhost:9000"
echo ""
echo "Now you can:"
echo "1. cd backend && npm install && npm run dev"
echo "2. cd frontend && npm run dev"
echo "3. Open http://localhost:5173 to test the uploader!"
