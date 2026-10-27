'use server'

import { revalidatePath } from 'next/cache'

import { getProfile, getSupabase } from '@/utils/supabase/queries'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_LABEL_LENGTH = 120

export async function saveFamilyTreeLabel(
  parentPersonId: string,
  inputLabel: string
): Promise<{ success: true; label: string } | { success: false; error: string }> {
  const profile = await getProfile()

  if (
    !profile?.is_active ||
    (profile.role !== 'admin' && profile.role !== 'editor')
  ) {
    return { success: false, error: 'Bạn không có quyền sửa nhãn trên cây gia phả.' }
  }

  if (!UUID_PATTERN.test(parentPersonId)) {
    return { success: false, error: 'Không xác định được nhóm con cần gắn nhãn.' }
  }

  if (typeof inputLabel !== 'string') {
    return { success: false, error: 'Nhãn không hợp lệ.' }
  }

  const label = inputLabel.trim()
  if (label.length > MAX_LABEL_LENGTH) {
    return {
      success: false,
      error: 'Nhãn không được vượt quá ' + MAX_LABEL_LENGTH + ' ký tự.'
    }
  }

  const supabase = await getSupabase()

  if (!label) {
    const { error } = await supabase
      .from('family_tree_labels')
      .delete()
      .eq('parent_person_id', parentPersonId)

    if (error) {
      console.error('Cannot delete family tree label:', error.message)
      return {
        success: false,
        error: 'Không lưu được thay đổi. Hãy kiểm tra bảng nhãn đã được tạo trong cơ sở dữ liệu.'
      }
    }
  } else {
    const { error } = await supabase.from('family_tree_labels').upsert(
      {
        parent_person_id: parentPersonId,
        label,
        updated_by: profile.id,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'parent_person_id' }
    )

    if (error) {
      console.error('Cannot save family tree label:', error.message)
      return {
        success: false,
        error: 'Không lưu được thay đổi. Hãy kiểm tra bảng nhãn đã được tạo trong cơ sở dữ liệu.'
      }
    }
  }

  revalidatePath('/dashboard/members')
  return { success: true, label }
}
