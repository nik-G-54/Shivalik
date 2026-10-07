import { Separator } from 'react-resizable-panels'
import clsx from 'clsx'

interface ResizeHandleProps {
  /** 'vertical' = a vertical line between side-by-side panels; 'horizontal' = a line between stacked panels. */
  direction: 'vertical' | 'horizontal'
}

/** 1px divider that lights up on hover/drag. */
export default function ResizeHandle({ direction }: ResizeHandleProps) {
  return (
    <Separator
      className={clsx(
        'bg-line transition-colors data-[separator=hover]:bg-sky-500 data-[separator=active]:bg-sky-500',
        direction === 'vertical' ? 'w-px' : 'h-px',
      )}
    />
  )
}
