import type React from 'react'

import { cn } from '@/lib/utils'

export function DataPageShell({
  header,
  toolbar,
  children,
  footer,
  className,
}: {
  header?: React.ReactNode
  toolbar?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex min-h-0 w-full flex-1 flex-col gap-4', className)}>
      {header ? <div className="shrink-0">{header}</div> : null}
      {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
      <div className="min-h-0 flex-1">{children}</div>
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </section>
  )
}

export function TableSurface({
  toolbar,
  children,
  className,
}: {
  toolbar?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border bg-background', className)}>
      {toolbar ? <div className="border-b bg-muted/30 px-2 py-2">{toolbar}</div> : null}
      <div className="min-h-[300px]">{children}</div>
    </div>
  )
}
