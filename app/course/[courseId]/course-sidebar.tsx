'use client'
import { ConceptGraph } from '@/components/ConceptGraph'
import type { ModuleMeta, Progress } from '@/lib/types'

interface Props {
  courseId: string
  modules: ModuleMeta[]
  progress: Progress[]
}

export function CourseSidebar({ courseId, modules, progress }: Props) {
  return (
    <ConceptGraph
      courseId={courseId}
      modules={modules}
      progress={progress}
    />
  )
}
