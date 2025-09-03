import React, { useEffect, useState } from 'react'
import { useUploadStore } from '../uploadStore'
import { CheckCircle, Upload, File, X, Pause, Play, AlertCircle, Clock, FolderOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

const EnhancedUploader: React.FC = () => {
  const { uploads, initWorker, addFiles, pauseUpload, resumeUpload, cancelUpload, removeUpload, resumeStoredSessions } = useUploadStore()
  const [isDragging, setIsDragging] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    const cleanup = initWorker()
    resumeStoredSessions()
    return cleanup
  }, [initWorker, resumeStoredSessions])

  // Check if any files are being saved
  useEffect(() => {
    const hasNewUploads = Object.values(uploads).some(u => u.progress.status === 'uploading' && u.progress.progress < 10)
    if (hasNewUploads) {
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 8000)
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

  const activeUploads = Object.values(uploads).filter(u => u.progress.status !== 'completed')
  const hasActiveUploads = activeUploads.length > 0

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Success Message Banner */}
      {showSuccessMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3 animate-slide-down">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-green-900">Files saved! You can navigate freely.</h3>
            <p className="text-sm text-green-700 mt-1">
              Your files are uploading in the background. Feel free to explore other sections - we'll notify you when they're ready.
            </p>
            <div className="mt-3 flex items-center space-x-4">
              <Link to="/projects" className="text-sm font-medium text-green-700 hover:text-green-800 flex items-center space-x-1">
                <FolderOpen className="w-4 h-4" />
                <span>Browse Projects</span>
              </Link>
              <Link to="/orders" className="text-sm font-medium text-green-700 hover:text-green-800">
                View Orders →
              </Link>
              <Link to="/marketplace" className="text-sm font-medium text-green-700 hover:text-green-800">
                Explore Marketplace →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
          <p className="text-sm text-gray-600 mt-1">
            Upload your files for translation. You can navigate away and we'll handle the rest.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drag & drop files here, or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports PDF, DOCX, TXT, and more. Multiple files allowed.
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <button className="bg-purple-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors">
            Select Files
          </button>
        </div>

        {/* Active Uploads */}
        {hasActiveUploads && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Active Uploads ({activeUploads.length})</h3>
              {activeUploads.some(u => u.progress.status === 'uploading') && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Uploading in background - feel free to navigate away</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {Object.entries(uploads).map(([id, upload]) => {
                const { progress } = upload
                if (progress.status === 'completed') return null

                const speedMBps = progress.speed ? (progress.speed / (1024 * 1024)).toFixed(2) : '0'
                const percentage = Math.round(progress.progress)
                
                return (
                  <div key={id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <File className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 truncate pr-4">
                            {progress.filename}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {progress.status === 'uploading' && (
                              <button
                                onClick={() => pauseUpload(id)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Pause upload"
                              >
                                <Pause className="w-4 h-4 text-gray-600" />
                              </button>
                            )}
                            {progress.status === 'paused' && (
                              <button
                                onClick={() => resumeUpload(id)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
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
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Cancel upload"
                            >
                              <X className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Enhanced Progress Bar */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>{percentage}%</span>
                            <span>{formatBytes(progress.loaded)} / {formatBytes(progress.total)}</span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                progress.status === 'error' ? 'bg-red-500' :
                                progress.status === 'paused' ? 'bg-yellow-500' :
                                'bg-purple-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            >
                              <div className="h-full bg-white/20 animate-pulse"></div>
                            </div>
                          </div>
                        </div>

                        {/* Status Information */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4 text-gray-600">
                            {progress.status === 'uploading' && progress.speed > 0 && (
                              <>
                                <span>{speedMBps} MB/s</span>
                                {progress.eta > 0 && (
                                  <span>ETA: {formatTime(progress.eta)}</span>
                                )}
                              </>
                            )}
                            {progress.status === 'paused' && (
                              <span className="text-yellow-600 flex items-center space-x-1">
                                <AlertCircle className="w-4 h-4" />
                                <span>Paused - Click play to resume</span>
                              </span>
                            )}
                            {progress.status === 'error' && (
                              <span className="text-red-600">Upload failed - Please try again</span>
                            )}
                          </div>
                          {progress.status === 'uploading' && (
                            <span className="text-purple-600 font-medium">Uploading...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Smart Background Uploads</p>
          <p>Your files continue uploading even when you navigate to other sections. If you close your browser, we'll automatically resume from where you left off when you return.</p>
        </div>
      </div>
    </div>
  )
}

export default EnhancedUploader
