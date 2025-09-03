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
    const newFiles = Object.values(uploads).filter(u => 
      u.progress.state === 'preparing' || 
      (u.progress.state === 'uploading' && u.progress.percent < 5)
    )
    
    if (newFiles.length > 0) {
      setShowSuccessMessage(true)
      // Keep showing for longer to encourage navigation
      setTimeout(() => setShowSuccessMessage(false), 15000)
      
      // Track recently added files for better UX
      setRecentlyAddedFiles(newFiles.map(f => f.progress.filename))
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

  const activeUploads = Object.values(uploads).filter(u => u.progress.state !== 'completed')
  const hasActiveUploads = activeUploads.length > 0
  const uploadingFiles = activeUploads.filter(u => u.progress.state === 'uploading')
  const preparingFiles = activeUploads.filter(u => u.progress.state === 'preparing')
  
  // Debug logging
  console.log('Uploads in component:', uploads)
  console.log('Active uploads:', activeUploads)
  console.log('Uploading files:', uploadingFiles)
  console.log('Preparing files:', preparingFiles)

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* IMMEDIATE SUCCESS BANNER - This is the key UX improvement */}
      {showSuccessMessage && (
        <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 flex items-start space-x-4 animate-slide-down shadow-lg">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-xl font-bold text-green-900">🎉 Files Saved Successfully!</h3>
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-base text-green-800 mb-4 leading-relaxed">
              <strong>Your files are now safely stored and uploading in the background.</strong> 
              You can close this page, navigate to other sections, or continue working - we'll handle everything automatically!
            </p>
            
            {/* Navigation Suggestions */}
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm font-medium text-green-900 mb-3">💡 What would you like to do next?</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link 
                  to="/projects" 
                  className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-all transform hover:scale-105"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Browse Projects</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  to="/orders" 
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all transform hover:scale-105"
                >
                  <Clock className="w-4 h-4" />
                  <span>View Orders</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  to="/marketplace" 
                  className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-all transform hover:scale-105"
                >
                  <File className="w-4 h-4" />
                  <span>Explore Marketplace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-green-600">
              💾 Files are automatically saved to your account • 🔄 Uploads continue in background • 📱 Get notified when complete
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
          <p className="text-gray-600">
            <strong>Zero waiting time:</strong> Your files are saved instantly and upload in the background while you work.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            isDragging ? 'border-purple-500 bg-purple-50 scale-105' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900 mb-2">
            Drag & drop files here, or click to browse
          </p>
          <p className="text-gray-500 mb-6">
            Supports PDF, DOCX, TXT, and more. Multiple files allowed.
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <button className="bg-purple-600 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-purple-700 transition-all transform hover:scale-105 shadow-md">
            Select Files
          </button>
        </div>
      </div>

      {/* Active Uploads Section */}
      {hasActiveUploads && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Active Uploads ({activeUploads.length})
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
            {Object.entries(uploads).map(([id, upload]) => {
              const { progress } = upload
              if (progress.state === 'completed') return null

              const speedMBps = progress.speedBps ? (progress.speedBps / (1024 * 1024)).toFixed(2) : '0'
              const percentage = Math.round(progress.percent)
              
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
                  
                  {/* Enhanced Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span className="font-medium">{percentage}% Complete</span>
                      <span className="text-purple-600 font-medium">
                        {progress.state === 'uploading' ? 'Uploading...' : 
                         progress.state === 'paused' ? 'Paused' : 'Preparing...'}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          progress.state === 'error' ? 'bg-red-500' :
                          progress.state === 'paused' ? 'bg-yellow-500' :
                          'bg-gradient-to-r from-purple-500 to-blue-500'
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
                      {progress.state === 'uploading' && progress.speedBps > 0 && (
                        <>
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span>{speedMBps} MB/s</span>
                          </span>
                          {progress.etaSeconds > 0 && (
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
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* DEMO: Show fake progress bar if no uploads */}
      {!hasActiveUploads && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <h3 className="text-lg font-semibold text-gray-900">Demo Progress Bar</h3>
            <p className="text-sm text-gray-600">This shows what the progress bar will look like during uploads</p>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <File className="w-8 h-8 text-purple-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">demo-file.pdf</h4>
                    <p className="text-sm text-gray-500">2.5 MB / 2.5 MB</p>
                  </div>
                </div>
              </div>
              
              {/* Demo Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span className="font-medium">67% Complete</span>
                  <span className="text-purple-600 font-medium">Uploading...</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                    style={{ width: '67%' }}
                  >
                    <div className="h-full bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Demo Status */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4 text-gray-600">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span>1.2 MB/s</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>ETA: 2s</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Background Uploads Info Box */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Smart Background Uploads</h3>
            <p className="text-blue-800 mb-4">
              Your files continue uploading even when you navigate to other sections. 
              <strong> If you close your browser, we'll automatically resume from where you left off when you return.</strong>
            </p>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">🚀 How it works:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Instant Save:</strong> File is saved to your account immediately</li>
                <li>• <strong>Background Upload:</strong> Continues while you work elsewhere</li>
                <li>• <strong>Auto-Resume:</strong> Picks up where it left off if interrupted</li>
                <li>• <strong>Smart Notifications:</strong> Get notified when uploads complete</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedUploader
