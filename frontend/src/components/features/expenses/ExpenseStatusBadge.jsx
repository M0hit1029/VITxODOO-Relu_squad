import { CircleCheckBig, Clock3, FileText, OctagonAlert } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

const iconMap = {
  draft: FileText,
  submitted: Clock3,
  approved: CircleCheckBig,
  rejected: OctagonAlert,
  pending: Clock3,
}

const variantMap = {
  draft: 'secondary',
  submitted: 'warning',
  approved: 'success',
  rejected: 'destructive',
  pending: 'warning',
}

export function ExpenseStatusBadge({ status }) {
  const Icon = iconMap[status] ?? FileText

  return (
    <span className={`relative inline-flex ${status === 'submitted' || status === 'pending' ? 'submitted-ring' : ''}`}>
      <Badge variant={variantMap[status]}>
        <Icon className="h-3.5 w-3.5" />
        <span className="capitalize">{status}</span>
      </Badge>
    </span>
  )
}
