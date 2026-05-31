import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'

export function DisclaimerBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-1.5',
        'bg-navy-50 border-b border-[var(--cl-border-subtle)]',
        'text-caption text-navy-700',
        className,
      )}
    >
      <Info size={13} strokeWidth={1.5} className="shrink-0" />
      Informational guidance, not legal advice.
    </div>
  )
}
