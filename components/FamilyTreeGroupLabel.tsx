'use client'

import { Check, Pencil, Plus, X } from 'lucide-react'
import { FormEvent, MouseEvent, useState } from 'react'

import { saveFamilyTreeLabel } from '@/app/actions/familyTreeLabels'

interface FamilyTreeGroupLabelProps {
  parentPersonId: string
  initialLabel?: string
  canEdit: boolean
}

export default function FamilyTreeGroupLabel({
  parentPersonId,
  initialLabel = '',
  canEdit
}: FamilyTreeGroupLabelProps) {
  const [label, setLabel] = useState(initialLabel)
  const [draft, setDraft] = useState(initialLabel)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const stopCanvasEvent = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
  }

  const beginEditing = () => {
    setDraft(label)
    setError('')
    setEditing(true)
  }

  const cancelEditing = () => {
    setDraft(label)
    setError('')
    setEditing(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    setSaving(true)
    setError('')
    try {
      const result = await saveFamilyTreeLabel(parentPersonId, draft)
      if (!result.success) {
        setError(result.error)
        return
      }
      setLabel(result.label)
      setDraft(result.label)
      setEditing(false)
    } catch {
      setError('Có lỗi khi lưu nhãn. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  if (!canEdit && !label) return null

  return (
    <div
      className='mt-2 flex min-h-7 flex-col items-center justify-center gap-1'
      onMouseDown={stopCanvasEvent}
      onClick={stopCanvasEvent}>
      {editing ? (
        <form
          onSubmit={handleSubmit}
          className='flex max-w-64 flex-wrap items-center justify-center gap-1 rounded-xl border border-amber-200 bg-white p-1.5 shadow-sm'>
          <input
            autoFocus
            value={draft}
            maxLength={120}
            onChange={(event) => setDraft(event.target.value)}
            placeholder='Ví dụ: Con ông Huy bà Sơn'
            aria-label='Nhãn nhóm con'
            className='w-52 rounded-lg border border-stone-200 px-2 py-1 text-sm text-stone-700 outline-none focus:border-amber-400'
          />
          <button
            type='submit'
            disabled={saving || draft.trim().length === 0}
            title='Lưu nhãn'
            aria-label='Lưu nhãn'
            className='flex size-7 items-center justify-center rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50'>
            <Check className='size-4' />
          </button>
          {label && (
            <button
              type='button'
              onClick={async () => {
                if (saving) return
                setSaving(true)
                setError('')
                try {
                  const result = await saveFamilyTreeLabel(parentPersonId, '')
                  if (!result.success) {
                    setError(result.error)
                    return
                  }
                  setLabel('')
                  setDraft('')
                  setEditing(false)
                } catch {
                  setError('Có lỗi khi xóa nhãn. Vui lòng thử lại.')
                } finally {
                  setSaving(false)
                }
              }}
              disabled={saving}
              title='Xóa nhãn'
              aria-label='Xóa nhãn'
              className='flex size-7 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50'>
              <X className='size-4' />
            </button>
          )}
          <button
            type='button'
            onClick={cancelEditing}
            disabled={saving}
            title='Hủy'
            aria-label='Hủy'
            className='flex size-7 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50'>
            <X className='size-4' />
          </button>
          {error && (
            <p role='alert' className='w-full max-w-60 px-1 text-xs text-red-600'>
              {error}
            </p>
          )}
        </form>
      ) : (
        <div className='flex items-center justify-center gap-1.5'>
          {label ? (
            <span className='inline-flex max-w-72 items-center rounded-full border border-stone-200 bg-white px-3 py-1 text-center text-sm font-medium text-amber-700 shadow-sm'>
              {label}
            </span>
          ) : null}
          {canEdit && (
            <button
              type='button'
              onClick={beginEditing}
              title={label ? 'Sửa nhãn nhóm con' : 'Thêm nhãn nhóm con'}
              aria-label={label ? 'Sửa nhãn nhóm con' : 'Thêm nhãn nhóm con'}
              className={'flex size-6 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-400 shadow-sm transition hover:border-amber-300 hover:text-amber-700 opacity-0 group-hover:opacity-100 focus:opacity-100'}>
              {label ? <Pencil className='size-3' /> : <Plus className='size-3' />}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
