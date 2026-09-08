import { useMemo, useState } from 'react'
import { useApp } from '../../store'
import Sheet from '../../components/Sheet'
import { EmptyState, ScreenHeader } from '../../components/ui'
import { IconPlus, IconTrash } from '../../components/Icons'
import type { Note } from '../../types'

export default function NotesScreen() {
  const app = useApp()
  const [sheet, setSheet] = useState<{ open: boolean; edit?: Note }>({ open: false })

  const notes = useMemo(
    () =>
      [...app.notes].sort(
        (a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt,
      ),
    [app.notes],
  )

  return (
    <div className="screen">
      <ScreenHeader
        title="Notes"
        subtitle="Quick money notes & reminders"
        right={
          <button className="btn btn--sm btn--primary" onClick={() => setSheet({ open: true })}>
            <IconPlus size={16} /> New
          </button>
        }
      />

      {notes.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="No notes yet"
          subtitle="Jot budgeting thoughts, reminders, or anything you want Buzz to keep nearby."
        />
      ) : (
        <div className="stack">
          {notes.map((n) => (
            <button
              key={n.id}
              className="card card--pad"
              onClick={() => setSheet({ open: true, edit: n })}
              style={{ textAlign: 'left', width: '100%' }}
            >
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 15 }}>
                {n.pinned ? '📌 ' : ''}
                {n.text.length > 220 ? n.text.slice(0, 220) + '…' : n.text}
              </div>
            </button>
          ))}
        </div>
      )}

      <Sheet
        open={sheet.open}
        onClose={() => setSheet({ open: false })}
        title={sheet.edit ? 'Edit note' : 'New note'}
      >
        <NoteForm initial={sheet.edit} onDone={() => setSheet({ open: false })} />
      </Sheet>
    </div>
  )
}

function NoteForm({ initial, onDone }: { initial?: Note; onDone: () => void }) {
  const app = useApp()
  const [text, setText] = useState(initial?.text ?? '')
  const [pinned, setPinned] = useState(initial?.pinned ?? false)

  async function submit() {
    const t = text.trim()
    if (!t) return
    if (initial) await app.updateNote({ ...initial, text: t, pinned })
    else {
      const n = await app.addNote(t)
      if (pinned) await app.updateNote({ ...n, pinned: true })
    }
    onDone()
  }

  return (
    <div className="stack">
      <textarea
        className="input"
        style={{ minHeight: 160, resize: 'vertical' }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Your money notes live here…"
        autoFocus
      />
      <label className="row row--between card card--pad" style={{ cursor: 'pointer' }}>
        <span style={{ fontWeight: 700 }}>📌 Pin to top</span>
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} style={{ width: 22, height: 22 }} />
      </label>
      <button className="btn btn--primary btn--block" disabled={!text.trim()} onClick={submit}>
        {initial ? 'Save note' : 'Add note'}
      </button>
      {initial && (
        <button
          className="btn btn--danger btn--block"
          onClick={async () => {
            await app.deleteNote(initial.id)
            onDone()
          }}
        >
          <IconTrash size={16} /> Delete
        </button>
      )}
    </div>
  )
}
