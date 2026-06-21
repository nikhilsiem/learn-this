import { Progress } from '@/components/ui/progress'

interface Props {
  completed: number
  total: number
}

export function ProgressBar({ completed, total }: Props) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{completed} of {total} modules complete</span>
        <span>{pct}%</span>
      </div>
      <Progress value={pct} />
    </div>
  )
}
