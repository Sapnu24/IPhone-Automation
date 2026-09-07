import { exportSnapshot, importSnapshot, type Snapshot } from './db'

/** Trigger a client-side download of some text as a file. */
export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function exportBackup(): Promise<void> {
  const snap = await exportSnapshot()
  const ts = new Date().toISOString().slice(0, 10)
  downloadText(`anchor-backup-${ts}.json`, JSON.stringify(snap, null, 2), 'application/json')
}

export async function importBackupFile(file: File): Promise<void> {
  const text = await file.text()
  let snap: Snapshot
  try {
    snap = JSON.parse(text) as Snapshot
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (!snap || typeof snap !== 'object' || !('transactions' in snap)) {
    throw new Error('That does not look like an Anchor backup file.')
  }
  await importSnapshot(snap)
}
