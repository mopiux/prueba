import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Eyebrow({
  index,
  children,
  className,
}: {
  index: string
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn("eyebrow flex items-center gap-3 text-muted-foreground", className)}>
      <span className="text-ember">[{index}]</span>
      <span aria-hidden="true" className="h-px w-8 bg-line" />
      <span>{children}</span>
    </p>
  )
}
