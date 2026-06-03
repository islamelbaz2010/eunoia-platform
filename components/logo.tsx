import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  href?: string
  className?: string
}

export function Logo({ href = '/', className }: LogoProps) {
  return (
    <Link href={href} className={cn('flex flex-col no-underline', className)}>
      <span
        className="font-mono text-xs font-bold tracking-[0.28em] uppercase"
        style={{
          background: 'linear-gradient(135deg, #b8922a, #d4aa45)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        EUNOIA
      </span>
      <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground leading-tight">
        Intelligence Platform
      </span>
    </Link>
  )
}
