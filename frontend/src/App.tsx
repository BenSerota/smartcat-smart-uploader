import React from 'react'
import { Uploader } from './components/Uploader'
import { ToastContainer } from './components/Toast'

export default function App() {
  return (
    <>
      <div style={{maxWidth: 900, margin: '40px auto', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
        <h1 style={{fontSize: 32, fontWeight: 700, color: '#1a1a1a', marginBottom: 8}}>
          Smartcat Resumable Uploader
        </h1>
        <p style={{fontSize: 16, color: '#666', marginBottom: 32, lineHeight: 1.5}}>
          Upload multiple files simultaneously. Your uploads continue while any Smartcat tab is open. 
          If you close all tabs, uploads will automatically resume when you return.
        </p>
        <Uploader />
      </div>
      <ToastContainer />
    </>
  )
}
