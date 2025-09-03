export type OPFSRef = {
  kind: 'opfs'
  path: string[]
} | {
  kind: 'blob'
  blob: Blob
}

async function ensureDir(root: FileSystemDirectoryHandle, parts: string[]): Promise<FileSystemDirectoryHandle> {
  let dir = root
  for (const p of parts) {
    dir = await dir.getDirectoryHandle(p, { create: true })
  }
  return dir
}

async function getDir(root: FileSystemDirectoryHandle, parts: string[]): Promise<FileSystemDirectoryHandle> {
  let dir = root
  for (const p of parts) {
    dir = await dir.getDirectoryHandle(p, { create: false })
  }
  return dir
}

export async function stageFileToOPFS(sessionId: string, file: File): Promise<OPFSRef> {
  if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
    return { kind: 'blob', blob: file }
  }
  const root = await navigator.storage.getDirectory()
  const dir = await ensureDir(root, ['uploads'])
  const handle = await dir.getFileHandle(`${sessionId}.bin`, { create: true })
  const writable = await handle.createWritable()
  const reader = file.stream().getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    await writable.write(value)
  }
  await writable.close()
  return { kind: 'opfs', path: ['uploads', `${sessionId}.bin`] }
}

export async function opfsFileExists(path: string[]): Promise<boolean> {
  if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) return false
  try {
    const root = await navigator.storage.getDirectory()
    const dir = await getDir(root, path.slice(0, -1))
    await dir.getFileHandle(path[path.length - 1], { create: false })
    return true
  } catch {
    return false
  }
}

export async function removeFromOPFS(sessionId: string): Promise<void> {
  if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
    return
  }
  try {
    const root = await navigator.storage.getDirectory()
    const uploadsDir = await root.getDirectoryHandle('uploads', { create: false })
    await uploadsDir.removeEntry(`${sessionId}.bin`)
  } catch (error) {
    // Ignore errors, file might not exist
  }
}
