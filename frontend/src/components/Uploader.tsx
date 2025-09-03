import React, { useEffect } from 'react'
import { useUploadStore } from '../uploadStore'
import { DragDropZone } from './DragDropZone'
import { UploadItemComponent } from './UploadItem'

export function Uploader() {
  const { uploads, addFiles, initWorker, getUploads, resumeStoredSessions } = useUploadStore()
  
  useEffect(() => {
    initWorker()
    // Resume any stored sessions after worker is initialized
    const timer = setTimeout(() => {
      resumeStoredSessions()
    }, 100)
    return () => clearTimeout(timer)
  }, [initWorker, resumeStoredSessions])
  
  const handleFilesSelected = async (files: File[]) => {
    await addFiles(files)
  }
  
  const activeUploads = getUploads()
  
  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 800,
    margin: '0 auto'
  }
  
  const uploadsContainerStyle: React.CSSProperties = {
    marginTop: 24
  }
  
  const titleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: '#333',
    marginBottom: 16
  }
  
  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: '40px 0'
  }
  
  return (
    <div style={containerStyle}>
      <DragDropZone 
        onFilesSelected={handleFilesSelected}
        multiple={true}
      />
      
      {activeUploads.length > 0 && (
        <div style={uploadsContainerStyle}>
          <h3 style={titleStyle}>Uploads ({activeUploads.length})</h3>
          {activeUploads.map(upload => (
            <UploadItemComponent 
              key={upload.sessionId || upload.file.name} 
              upload={upload} 
            />
          ))}
        </div>
      )}
      
      {activeUploads.length === 0 && (
        <div style={emptyStyle}>
          No uploads in progress
        </div>
      )}
    </div>
  )
}