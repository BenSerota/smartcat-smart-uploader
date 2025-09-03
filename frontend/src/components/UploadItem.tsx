import React from 'react'
import type { UploadItem } from '../uploadTypes'
import { useUploadStore } from '../uploadStore'

interface UploadItemProps {
  upload: UploadItem
}

export function UploadItemComponent({ upload }: UploadItemProps) {
  const { pauseUpload, resumeUpload, cancelUpload, removeUpload } = useUploadStore()
  const progress = upload.progress
  
  if (!progress) return null
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const formatSpeed = (bps: number): string => {
    if (bps === 0) return '0 KB/s'
    return formatBytes(bps) + '/s'
  }
  
  const formatTime = (seconds: number | null): string => {
    if (seconds === null || seconds === 0) return '–'
    if (seconds < 60) return Math.round(seconds) + 's'
    const minutes = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${minutes}m ${secs}s`
  }
  
  const getStatusColor = (): string => {
    switch (progress.state) {
      case 'completed': return '#4caf50'
      case 'error': return '#f44336'
      case 'paused': return '#ff9800'
      case 'cancelled': return '#757575'
      default: return '#2196f3'
    }
  }
  
  const containerStyle: React.CSSProperties = {
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  }
  
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  }
  
  const fileNameStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 500,
    color: '#333',
    margin: 0,
    wordBreak: 'break-word',
    flex: 1,
    marginRight: 12
  }
  
  const statusStyle: React.CSSProperties = {
    fontSize: 12,
    color: getStatusColor(),
    fontWeight: 500,
    textTransform: 'capitalize'
  }
  
  const progressBarContainer: React.CSSProperties = {
    width: '100%',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  }
  
  const progressBar: React.CSSProperties = {
    height: '100%',
    backgroundColor: getStatusColor(),
    width: `${progress.percent}%`,
    transition: 'width 0.3s ease',
    borderRadius: 4
  }
  
  const statsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#666',
    marginBottom: 8
  }
  
  const buttonContainer: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    marginTop: 12
  }
  
  const buttonStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: 12,
    border: '1px solid #ddd',
    borderRadius: 4,
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
  
  const renderActions = () => {
    switch (progress.state) {
      case 'uploading':
        return (
          <>
            <button 
              style={buttonStyle} 
              onClick={() => pauseUpload(upload.sessionId!)}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
            >
              Pause
            </button>
            <button 
              style={{ ...buttonStyle, color: '#f44336', borderColor: '#f44336' }} 
              onClick={() => cancelUpload(upload.sessionId!)}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ffebee'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
            >
              Cancel
            </button>
          </>
        )
      case 'paused':
        return (
          <>
            <button 
              style={{ ...buttonStyle, color: '#2196f3', borderColor: '#2196f3' }} 
              onClick={() => resumeUpload(upload.sessionId!)}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e3f2fd'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
            >
              Resume
            </button>
            <button 
              style={{ ...buttonStyle, color: '#f44336', borderColor: '#f44336' }} 
              onClick={() => cancelUpload(upload.sessionId!)}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ffebee'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
            >
              Cancel
            </button>
          </>
        )
      case 'completed':
      case 'cancelled':
      case 'error':
        return (
          <button 
            style={buttonStyle} 
            onClick={() => removeUpload(upload.sessionId!)}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            Remove
          </button>
        )
      default:
        return null
    }
  }
  
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <p style={fileNameStyle}>{upload.file.name}</p>
        <span style={statusStyle}>{progress.state}</span>
      </div>
      
      {progress.state !== 'preparing' && (
        <>
          <div style={progressBarContainer}>
            <div style={progressBar} />
          </div>
          
          <div style={statsStyle}>
            <span>{formatBytes(progress.bytesUploaded)} / {formatBytes(progress.totalBytes)}</span>
            <span>{progress.percent.toFixed(1)}%</span>
          </div>
          
          {(progress.state === 'uploading' || progress.state === 'paused') && (
            <div style={statsStyle}>
              <span>Speed: {formatSpeed(progress.speedBps)}</span>
              <span>ETA: {formatTime(progress.etaSeconds)}</span>
            </div>
          )}
        </>
      )}
      
      {upload.error && (
        <div style={{ color: '#f44336', fontSize: 12, marginTop: 8 }}>
          Error: {upload.error}
        </div>
      )}
      
      <div style={buttonContainer}>
        {renderActions()}
      </div>
    </div>
  )
}
