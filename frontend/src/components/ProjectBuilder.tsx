import React, { useState, useEffect } from 'react'
import { Upload, FileText, Settings, ChevronDown, ArrowRightLeft, Globe, CheckCircle, Sparkles, FolderOpen, Clock, File, ArrowRight, X, Pause, Play, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUploadStore } from '../uploadStore'
import { mockUploader } from '../mockUploader'

const ProjectBuilder: React.FC = () => {
  const { uploads, addFiles, pauseUpload, resumeUpload, cancelUpload, removeUpload, resumeStoredSessions, initWorker } = useUploadStore()
  const [isDragging, setIsDragging] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sourceLanguage, setSourceLanguage] = useState('English (US)')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [recentLanguages] = useState(['Spanish', 'French', 'German', 'Italian'])
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Initialize worker and resume stored sessions on mount
  useEffect(() => {
    initWorker()
    resumeStoredSessions()
  }, [initWorker, resumeStoredSessions])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFiles = (files: File[]) => {
    files.forEach((file, index) => {
      const sessionId = `mock-${Date.now()}-${index}`
      
      // Add to upload store
      addFiles([file])
      
      // Start mock upload after a short delay
      setTimeout(() => {
        mockUploader.startMockUpload(file, sessionId)
      }, 500 + index * 200) // Stagger uploads
    })
  }

  // Show success message when files are added/uploading, hide when all completed
  useEffect(() => {
    const allUploads = Array.from(uploads.values())
    const completedUploads = allUploads.filter(u => u.progress && u.progress.state === 'completed')
    const hasActiveUploads = allUploads.some(u => u.progress && u.progress.state !== 'completed')
    
    // Show success message when files are added (uploading or completed)
    if (allUploads.length > 0) {
      setShowSuccessMessage(true)
      
      // If all files are completed, auto-hide after 5 seconds
      if (completedUploads.length === allUploads.length && !hasActiveUploads) {
        setTimeout(() => setShowSuccessMessage(false), 5000)
      }
    } else {
      setShowSuccessMessage(false)
    }
  }, [uploads])

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

  const uploadedFiles = Array.from(uploads.values())
  const hasFiles = uploadedFiles.length > 0
  const allUploads = Array.from(uploads.values()).filter(u => u.progress) // Show all uploads including completed
  const hasUploads = allUploads.length > 0
  const activeUploads = allUploads.filter(u => u.progress && u.progress.state !== 'completed')
  const hasActiveUploads = activeUploads.length > 0
  const uploadingFiles = activeUploads.filter(u => u.progress && u.progress.state === 'uploading')

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Agent Header */}
      <div className="flex items-start space-x-4 mb-8">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Document Translator</h1>
              <p className="text-gray-600 mt-1">Translates documents while preserving formatting and style.</p>
            </div>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              Change agent
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area with Side-by-Side Layout */}
      <div className="flex gap-6">
        {/* Main Project Builder Content */}
        <div className="flex-1">

          {/* Upload Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload files you want me to work on</h2>
        
            <div
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                isDragging ? 'border-purple-500 bg-purple-50' : 'border-purple-300 hover:border-purple-400 hover:bg-purple-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drag & drop or browse files to upload
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Subtitles, video, PDF, XLIFF, XLSX, PowerPoint, or{' '}
                <button className="text-purple-600 hover:text-purple-700 underline">
                  80+ more formats
                </button>
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                Browse files
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mt-3">
              Note that you can add files even after creating the project.
            </p>
          </div>

          {/* Upload Progress Section - Directly below D&D zone */}
          {hasUploads && (
            <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Upload Status ({allUploads.length})
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
                {allUploads.map((upload) => {
                  const id = upload.sessionId || ''
                  const { progress } = upload

                  if (!progress) return null

                  // Fake uploader with realistic 3-minute process
                  const fakeProgress = {
                    ...progress,
                    filename: progress.filename || 'document.pdf',
                    totalBytes: progress.totalBytes || 100 * 1024 * 1024, // 100MB default
                    bytesUploaded: Math.min(progress.bytesUploaded || 0, progress.totalBytes || 100 * 1024 * 1024),
                    percent: Math.min(progress.percent || 0, 100),
                    speedBps: progress.speedBps || 0,
                    state: progress.percent >= 100 ? 'completed' : progress.state
                  }
                  
                  const speedMBps = fakeProgress.speedBps ? (fakeProgress.speedBps / (1024 * 1024)).toFixed(2) : '0'
                  const percentage = Math.max(0, Math.min(100, Math.round(fakeProgress.percent || 0)))
                  
                  return (
                    <div key={id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-purple-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">{fakeProgress.filename}</h4>
                            <p className="text-sm text-gray-500">
                              {formatBytes(fakeProgress.bytesUploaded)} / {formatBytes(fakeProgress.totalBytes)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {fakeProgress.state === 'uploading' && (
                            <button
                              onClick={() => {
                                mockUploader.pauseUpload(id)
                                pauseUpload(id)
                              }}
                              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Pause upload"
                            >
                              <Pause className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          {fakeProgress.state === 'paused' && (
                            <button
                              onClick={() => {
                                mockUploader.resumeUpload(id)
                                resumeUpload(id)
                              }}
                              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Resume upload"
                            >
                              <Play className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              mockUploader.cancelUpload(id)
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
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span className="font-medium">{percentage}% Complete</span>
                          <span className={`font-medium ${
                            fakeProgress.state === 'uploading' ? 'text-purple-600' :
                            fakeProgress.state === 'paused' ? 'text-yellow-600' :
                            fakeProgress.state === 'completed' ? 'text-green-600' :
                            'text-blue-600'
                          }`}>
                            {fakeProgress.state === 'uploading' ? 'Uploading...' : 
                             fakeProgress.state === 'paused' ? 'Paused' : 
                             fakeProgress.state === 'completed' ? 'Completed!' :
                             'Preparing...'}
                          </span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              fakeProgress.state === 'error' ? 'bg-red-500' :
                              fakeProgress.state === 'paused' ? 'bg-yellow-500' :
                              fakeProgress.state === 'completed' ? 'bg-green-500' :
                              'bg-gradient-to-r from-purple-500 to-blue-500'
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                          >
                            <div className={`h-full bg-white/20 ${fakeProgress.state === 'completed' ? '' : 'animate-pulse'}`}></div>
                          </div>
                        </div>
                      </div>

                      {/* Status Information */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4 text-gray-600">
                          {fakeProgress.state === 'uploading' && fakeProgress.speedBps > 0 && (
                            <>
                              <span className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span>{speedMBps} MB/s</span>
                              </span>
                              {fakeProgress.etaSeconds && fakeProgress.etaSeconds > 0 && (
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>ETA: {formatTime(fakeProgress.etaSeconds)}</span>
                                </span>
                              )}
                            </>
                          )}
                          {fakeProgress.state === 'paused' && (
                            <span className="text-yellow-600 flex items-center space-x-1">
                              <AlertCircle className="w-4 h-4" />
                              <span>Paused - Click play to resume</span>
                            </span>
                          )}
                          {fakeProgress.state === 'preparing' && (
                            <span className="text-blue-600 flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Preparing file for upload...</span>
                            </span>
                          )}
                          {fakeProgress.state === 'completed' && (
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

          {/* Language Selection */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Source Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I'll translate from*
                </label>
                <div className="relative">
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Italian">Italian</option>
                    <option value="Portuguese">Portuguese</option>
                    <option value="Russian">Russian</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Korean">Korean</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex items-end justify-center md:justify-start">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <ArrowRightLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Target Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I'll translate to*
                </label>
                <div className="relative">
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select target languages</option>
                    <option value="English (US)">English (US)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Italian">Italian</option>
                    <option value="Portuguese">Portuguese</option>
                    <option value="Russian">Russian</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Korean">Korean</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Recently Used Languages */}
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Recently used:</p>
              <div className="flex flex-wrap gap-2">
                {recentLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setTargetLanguage(lang)}
                    className="px-3 py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="mb-8">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">What else?</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter project name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality Level
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Create Project Button */}
          <div className="flex justify-end">
            <button
              disabled={!hasFiles || !targetLanguage}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                hasFiles && targetLanguage
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Create project
            </button>
          </div>
        </div>

        {/* Success Message Sidebar */}
        {showSuccessMessage && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-gradient-to-b from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex flex-col shadow-lg">
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
                <br />
                <span className="text-green-700 font-medium">💾 If you close the site, uploads will resume when you return.</span>
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

    </div>
  )
}

export default ProjectBuilder
