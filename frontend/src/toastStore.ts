import { create } from 'zustand'
import type { ToastMessage } from './uploadTypes'

interface ToastStore {
  toasts: ToastMessage[]
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast = { ...toast, id }
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))
    
    // Auto-remove after duration (default 5s)
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }))
    }, toast.duration || 5000)
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  }))
}))

// Helper functions
export const showToast = {
  success: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ type: 'success', message, duration }),
  error: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ type: 'error', message, duration }),
  info: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ type: 'info', message, duration })
}
