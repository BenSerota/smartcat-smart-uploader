import React, { useEffect, useState } from 'react'
import { useUploadStore } from '../uploadStore'
import { CheckCircle, Upload, File, X, Pause, Play, AlertCircle, Clock, FolderOpen, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const EnhancedUploader: React.FC = () => {
  const { uploads, initWorker, addFiles, pauseUpload, resumeUpload, cancelUpload, removeUpload, resumeStoredSessions } = useUploadStore()
  const [isDragging, setIsDragging] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [recentlyAddedFiles, setRecentlyAddedFiles] = useState<string[]>([])

  useEffect(() => {
    const cleanup = initWorker()
    resumeStoredSessions()
    return cleanup
  }, [initWorker, resumeStoredSessions])

  // Show success message immediately when files are added
  useEffect(() => {
    const newFiles = Array.from(uploads.values()).filter(u => 
      u.progress && (
        u.progress.state === 'preparing' || 
        u.progress.state === 'uploading' ||
        u.progress.state === 'completed'
      )
    )
    
    if (newFiles.length > 0) {
      setShowSuccessMessage(true)
      // Keep showing for longer to encourage navigation
      setTimeout(() => setShowSuccessMessage(false), 25000)
      
      // Track recently added files for better UX
      setRecentlyAddedFiles(newFiles.map(f => f.progress?.filename || ''))
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

  const activeUploads = Array.from(uploads.values()).filter(u => u.progress && u.progress.state !== 'completed')
  const hasActiveUploads = activeUploads.length > 0
  const uploadingFiles = activeUploads.filter(u => u.progress && u.progress.state === 'uploading')
  const preparingFiles = activeUploads.filter(u => u.progress && u.progress.state === 'preparing')
  const recentlyCompleted = Array.from(uploads.values()).filter(u => u.progress && u.progress.state === 'completed')
  
  // Debug logging for troubleshooting
  console.log('Uploads in component:', uploads)
  console.log('Active uploads:', activeUploads)
  console.log('Uploading files:', uploadingFiles)
  console.log('Preparing files:', preparingFiles)
  console.log('Show success message:', showSuccessMessage)
  
  // Log each upload's progress
  activeUploads.forEach((upload, index) => {
    console.log(`Upload ${index}:`, {
      sessionId: upload.sessionId,
      filename: upload.progress?.filename,
      percent: upload.progress?.percent,
      state: upload.progress?.state,
      bytesUploaded: upload.progress?.bytesUploaded,
      totalBytes: upload.progress?.totalBytes
    })
  })
  
  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Main Content Area with Side-by-Side Layout */}
      <div className="flex gap-6">
        {/* Upload Area */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Documents</h2>
              <p className="text-sm text-gray-600">
                Files are saved instantly and upload in the background.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Supports PDF, DOCX, TXT, and more. Multiple files allowed.
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                Select Files
              </button>
            </div>
          </div>
        </div>

        {/* Success Message Sidebar */}
        {showSuccessMessage && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-gradient-to-b from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 h-full flex flex-col shadow-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-green-900">Files Saved!</h3>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs">🎉</span>
                    <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-green-800 mb-4 leading-relaxed">
                Your files are uploading in the background. You can continue working while they upload.
              </p>
              
              {/* Navigation Suggestions - Vertical Layout */}
              <div className="flex-1">
                <p className="text-xs font-medium text-green-900 mb-2">💡 What's next?</p>
                <div className="space-y-2">
                  <Link 
                    to="/projects" 
                    className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors w-full"
                  >
                    <FolderOpen className="w-3 h-3" />
                    <span>Browse Projects</span>
                    <ArrowRight className="w-3 h-3 ml-auto" />
                  </Link>
                  <Link 
                    to="/orders" 
                    className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors w-full"
                  >
                    <Clock className="w-3 h-3" />
                    <span>View Orders</span>
                    <ArrowRight className="w-3 h-3 ml-auto" />
                  </Link>
                  <Link 
                    to="/marketplace" 
                    className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors w-full"
                  >
                    <File className="w-3 h-3" />
                    <span>Explore Marketplace</span>
                    <ArrowRight className="w-3 h-3 ml-auto" />
                  </Link>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-green-200">
                <div className="text-xs text-green-600 space-y-1">
                  <div className="flex items-center space-x-1">
                    <span>💾</span>
                    <span>Auto-saved to account</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>🔄</span>
                    <span>Background upload</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📱</span>
                    <span>Notifications enabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Uploads Section - Show only when there are active uploads */}
      {hasActiveUploads && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Status ({activeUploads.length})
              </h3>
              {uploadingFiles.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <Clock className="w-4 h-4" />
                  <span>{uploadingFiles.length} uploading in background</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {activeUploads.map((upload) => {
              const id = upload.sessionId || ''
              const { progress } = upload

              if (!progress) return null

              const speedMBps = progress.speedBps ? (progress.speedBps / (1024 * 1024)).toFixed(2) : '0'
              const percentage = Math.round(progress.percent)
              
              // Debug logging
              console.log('Upload progress:', {
                id,
                filename: progress.filename,
                percent: progress.percent,
                percentage,
                state: progress.state,
                bytesUploaded: progress.bytesUploaded,
                totalBytes: progress.totalBytes
              })
              
              return (
                <div key={id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <File className="w-8 h-8 text-purple-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{progress.filename}</h4>
                        <p className="text-sm text-gray-500">
                          {formatBytes(progress.bytesUploaded)} / {formatBytes(progress.totalBytes)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {progress.state === 'uploading' && (
                        <button
                          onClick={() => pauseUpload(id)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Pause upload"
                        >
                          <Pause className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                      {progress.state === 'paused' && (
                        <button
                          onClick={() => resumeUpload(id)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Resume upload"
                        >
                          <Play className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          cancelUpload(id)
                          removeUpload(id)
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Cancel upload"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress Bar - Only show for actual uploads */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span className="font-medium">{percentage}% Complete</span>
                      <span className={`font-medium ${
                        progress.state === 'uploading' ? 'text-purple-600' :
                        progress.state === 'paused' ? 'text-yellow-600' :
                        progress.state === 'completed' ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        {progress.state === 'uploading' ? 'Uploading...' : 
                         progress.state === 'paused' ? 'Paused' : 
                         progress.state === 'completed' ? 'Completed!' :
                         'Preparing...'}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          progress.state === 'error' ? 'bg-red-500' :
                          progress.state === 'paused' ? 'bg-yellow-500' :
                          progress.state === 'completed' ? 'bg-green-500' :
                          'bg-gradient-to-r from-purple-500 to-blue-500'
                        }`}
                        style={{ width: `${Math.max(1, percentage)}%` }}
                      >
                        <div className={`h-full bg-white/20 ${progress.state === 'completed' ? '' : 'animate-pulse'}`}></div>
                      </div>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4 text-gray-600">
                      {progress.state === 'uploading' && progress.speedBps > 0 && (
                        <>
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span>{speedMBps} MB/s</span>
                          </span>
                          {progress.etaSeconds && progress.etaSeconds > 0 && (
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>ETA: {formatTime(progress.etaSeconds)}</span>
                            </span>
                          )}
                        </>
                      )}
                      {progress.state === 'paused' && (
                        <span className="text-yellow-600 flex items-center space-x-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>Paused - Click play to resume</span>
                        </span>
                      )}
                      {progress.state === 'preparing' && (
                        <span className="text-blue-600 flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Preparing file for upload...</span>
                        </span>
                      )}
                      {progress.state === 'completed' && (
                        <span className="text-green-600 flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>Upload completed successfully!</span>
                        </span>
                      )}
                    </div>
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

export default EnhancedUploader
