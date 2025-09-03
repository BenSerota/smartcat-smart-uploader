import React, { useState, useRef, DragEvent } from 'react'

interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
}

export function DragDropZone({ onFilesSelected, accept, multiple = true, disabled = false }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0
    
    if (disabled) return
    
    const files: File[] = []
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i]
        if (!accept || checkAccept(file, accept)) {
          files.push(file)
          if (!multiple) break
        }
      }
      if (files.length > 0) {
        onFilesSelected(files)
      }
    }
  }
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }
  
  const checkAccept = (file: File, accept: string): boolean => {
    const acceptedTypes = accept.split(',').map(t => t.trim())
    return acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      if (type.endsWith('/*')) {
        const mainType = type.split('/')[0]
        return file.type.startsWith(mainType + '/')
      }
      return file.type === type
    })
  }
  
  const containerStyle: React.CSSProperties = {
    border: `2px dashed ${isDragging ? '#2196f3' : '#ccc'}`,
    borderRadius: 12,
    padding: '40px 20px',
    textAlign: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    backgroundColor: isDragging ? '#f0f8ff' : disabled ? '#f5f5f5' : 'white',
    transition: 'all 0.3s ease',
    position: 'relative',
    minHeight: 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16
  }
  
  const iconStyle: React.CSSProperties = {
    width: 64,
    height: 64,
    opacity: disabled ? 0.3 : isDragging ? 1 : 0.6,
    color: isDragging ? '#2196f3' : '#666',
    transition: 'all 0.3s ease'
  }
  
  const textStyle: React.CSSProperties = {
    fontSize: 16,
    color: disabled ? '#999' : '#333',
    fontWeight: 500,
    margin: 0
  }
  
  const subTextStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#666',
    margin: 0
  }
  
  const buttonStyle: React.CSSProperties = {
    padding: '10px 24px',
    backgroundColor: disabled ? '#ccc' : '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.3s ease'
  }
  
  return (
    <div
      style={containerStyle}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileInput}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
      />
      
      <svg style={iconStyle} fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
      </svg>
      
      <div>
        <p style={textStyle}>
          {isDragging ? 'Drop files here' : 'Drag and drop files here'}
        </p>
        <p style={subTextStyle}>or</p>
      </div>
      
      <button
        style={buttonStyle}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = '#1976d2'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = '#2196f3'
          }
        }}
      >
        Browse Files
      </button>
      
      {accept && (
        <p style={{ ...subTextStyle, fontSize: 12 }}>
          Accepted files: {accept}
        </p>
      )}
    </div>
  )
}
