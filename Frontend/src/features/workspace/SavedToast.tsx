import { Check } from 'lucide-react'
import clsx from 'clsx'

interface SavedToastProps {
  visible: boolean
}

export default function SavedToast({ visible }: SavedToastProps) {
  return (
    <div
      role="status"
      className={clsx(
        'pointer-events-none absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded border border-line bg-panel px-3 py-1.5 text-[13px] shadow-lg transition-all duration-200',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      )}
    >
      <Check className="h-4 w-4 text-pass" />
      Saved
    </div>
  )
}
