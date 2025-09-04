import React, { useEffect, useState } from 'react'
import { useMockUploadStore } from '../mockUploadStore'
import { CheckCircle, Upload, File, X, Pause, Play, AlertCircle, Clock, FolderOpen, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const MockEnhancedUploader: React.FC = () => {
  const { uploads, initMockUploader, addFiles, pauseUpload, resumeUpload, cancelUpload, removeUpload } = useMockUploadStore()
  const [isDragging, setIsDragging] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [recentlyAddedFiles, setRecentlyAddedFiles] = useState<string[]>([])

  useEffect(() => {
    initMockUploader()
  }, [initMockUploader])

  // Show success message immediately when files are added
  useEffect(() => {
    const newFiles = Array.from(uploads.values()).filter(u => 
      u.progress.state === 'preparing' || 
      u.progress.state === 'uploading' ||
      u.progress.state === 'completed'
    )
    
    if (newFiles.length > 0) {
      setShowSuccessMessage(true)
      // Keep showing for longer to encourage navigation
      setTimeout(() => setShowSuccessMessage(false), 25000)
      
      // Track recently added files for better UX
      setRecentlyAddedFiles(newFiles.map(f => f.progress.filename))
    } else {
      // Hide success message when no uploads
      setShowSuccessMessage(false)
    }
  }, [uploads])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      addFiles(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      addFiles(files)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`
  }

  const activeUploads = Array.from(uploads.values()).filter(u => u.progress.state !== 'completed')
  const hasActiveUploads = activeUploads.length > 0
  const uploadingFiles = activeUploads.filter(u => u.progress.state === 'uploading')
  const preparingFiles = activeUploads.filter(u => u.progress.state === 'preparing')
  const recentlyCompleted = Array.from(uploads.values()).filter(u => u.progress.state === 'completed')
  
  // Debug logging for troubleshooting
  console.log('Mock Uploads in component:', uploads)
  console.log('Active uploads:', activeUploads)
  console.log('Uploading files:', uploadingFiles)
  console.log('Preparing files:', preparingFiles)
  console.log('Show success message:', showSuccessMessage)
  
  return (
    <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col">
      {/* Compact Success Message */}
      {showSuccessMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-900 mb-1">Files saved successfully</h3>
            <p className="text-xs text-green-700 mb-2">Your files are uploading in the background. You can continue working while they upload.</p>
            <div className="flex items-center space-x-4">
              <Link 
                to="/projects" 
                className="text-xs text-green-600 hover:text-green-800 font-medium"
              >
                Browse Projects →
              </Link>
              <Link 
                to="/orders" 
                className="text-xs text-green-600 hover:text-green-800 font-medium"
              >
                View Orders →
              </Link>
              <Link 
                to="/marketplace" 
                className="text-xs text-green-600 hover:text-green-800 font-medium"
              >
                Explore Marketplace →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Documents</h2>
          <p className="text-sm text-gray-600">
            Files are saved instantly and upload in the background.
          </p>
        </div>

        {/* Compact Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all ${
            isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="flex items-center justify-center space-x-3">
            <Upload className="w-6 h-6 text-gray-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports PDF, DOCX, TXT, and more
              </p>
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button className="bg-purple-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-purple-700 transition-colors">
              Select Files
            </button>
          </div>
        </div>
      </div>

      {/* Compact Upload Status - Show when there are uploads */}
      {(hasActiveUploads || recentlyCompleted.length > 0) && (
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Upload Status ({activeUploads.length + recentlyCompleted.length})
              </h3>
              {uploadingFiles.length > 0 && (
                <div className="flex items-center space-x-1 text-xs text-blue-600">
                  <Clock className="w-3 h-3" />
                  <span>{uploadingFiles.length} uploading</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
            {Array.from(uploads.entries()).map(([id, upload]) => {
              const { progress } = upload
              const percentage = Math.round(progress.percent)
              
              return (
                <div key={id} className="bg-gray-50 rounded p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <File className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{progress.filename}</h4>
                        <p className="text-xs text-gray-500">
                          {formatBytes(progress.bytesUploaded)} / {formatBytes(progress.totalBytes)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {progress.state === 'uploading' && (
                        <button
                          onClick={() => pauseUpload(id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Pause upload"
                        >
                          <Pause className="w-3 h-3 text-gray-600" />
                        </button>
                      )}
                      {progress.state === 'paused' && (
                        <button
                          onClick={() => resumeUpload(id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Resume upload"
                        >
                          <Play className="w-3 h-3 text-gray-600" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          cancelUpload(id)
                          removeUpload(id)
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Cancel upload"
                      >
                        <X className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Compact Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>{percentage}%</span>
                      <span className={`${
                        progress.state === 'uploading' ? 'text-purple-600' :
                        progress.state === 'paused' ? 'text-yellow-600' :
                        progress.state === 'completed' ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        {progress.state === 'uploading' ? 'Uploading' : 
                         progress.state === 'paused' ? 'Paused' : 
                         progress.state === 'completed' ? 'Completed' :
                         'Preparing'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          progress.state === 'error' ? 'bg-red-500' :
                          progress.state === 'paused' ? 'bg-yellow-500' :
                          progress.state === 'completed' ? 'bg-green-500' :
                          'bg-purple-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Compact Status Info */}
                  <div className="text-xs text-gray-600">
                    {progress.state === 'uploading' && progress.speedBps > 0 && (
                      <span className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        <span>{(progress.speedBps / (1024 * 1024)).toFixed(1)} MB/s</span>
                        {progress.etaSeconds > 0 && (
                          <span>• ETA: {formatTime(progress.etaSeconds)}</span>
                        )}
                      </span>
                    )}
                    {progress.state === 'paused' && (
                      <span className="text-yellow-600">Paused - Click play to resume</span>
                    )}
                    {progress.state === 'preparing' && (
                      <span className="text-blue-600">Preparing file...</span>
                    )}
                    {progress.state === 'completed' && (
                      <span className="text-green-600">Upload completed!</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

export default MockEnhancedUploader
