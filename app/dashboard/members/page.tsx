import { Suspense } from 'react'

import MembersViews from '@/components/MembersViews'
import MemberDetailModal from '@/components/modal/MemberDetailModal'
import ViewToggle, { ViewMode } from '@/components/ViewToggle'
import { MemberListProvider } from '@/context/MemberListContext'
import { fetchAllRows } from '@/utils/supabase/fetchAll'
import { getProfile, getSupabase } from '@/utils/supabase/queries'

interface PageProps {
  searchParams: Promise<{ view?: string; rootId?: string; avatar?: string }>
}
export default async function FamilyTreePage({ searchParams }: PageProps) {
  const { view, rootId, avatar } = await searchParams
  const initialView = view as ViewMode | undefined
  const initialShowAvatar = avatar !== 'hide'

  const profile = await getProfile()
  const canEdit =
    profile?.is_active === true &&
    (profile.role === 'admin' || profile.role === 'editor')

  // If view is list, we only need persons, not relationships.
  // We fetch persons for all views to pass down as a prop if we want, or let components fetch.
  // Actually, to make transitions fast and avoid duplicate fetching across components,
  // we will fetch data here and pass it down as props.
  const supabase = await getSupabase()

  const [personsRes, relsRes, labelsRes] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from('persons')
        .select('*')
        .order('birth_year', { ascending: true, nullsFirst: false })
        .order('id')
        .range(from, to)
    ),
    fetchAllRows((from, to) =>
      supabase.from('relationships').select('*').order('id').range(from, to)
    ),
    supabase.from('family_tree_labels').select('parent_person_id, label')
  ])

  const persons = personsRes.data || []
  const relationships = relsRes.data || []
  if (labelsRes.error && !labelsRes.error.message.includes('family_tree_labels')) {
    console.error('Cannot load family tree labels:', labelsRes.error.message)
  }
  const groupLabels = Object.fromEntries(
    (labelsRes.data ?? []).map((row) => [row.parent_person_id, row.label])
  ) as Record<string, string>

  // Prepare map and roots for tree views
  const personsMap = new Map()
  persons.forEach((p) => personsMap.set(p.id, p))

  const childIds = new Set(
    relationships
      .filter(
        (r) => r.type === 'biological_child' || r.type === 'adopted_child'
      )
      .map((r) => r.person_b)
  )

  let finalRootId = rootId

  // If no rootId is provided, fallback to the earliest created person
  if (!finalRootId || !personsMap.has(finalRootId)) {
    const rootsFallback = persons.filter((p) => !childIds.has(p.id))
    if (rootsFallback.length > 0) {
      finalRootId = rootsFallback[0].id
    } else if (persons.length > 0) {
      finalRootId = persons[0].id // ultimate fallback
    }
  }

  return (
    <Suspense fallback={null}>
      <MemberListProvider
        initialView={initialView}
        initialRootId={finalRootId}
        initialShowAvatar={initialShowAvatar}>
        <ViewToggle />
        <MembersViews
          persons={persons}
          relationships={relationships}
          canEdit={canEdit}
          groupLabels={groupLabels}
        />

        <MemberDetailModal />
      </MemberListProvider>
    </Suspense>
  )
}
