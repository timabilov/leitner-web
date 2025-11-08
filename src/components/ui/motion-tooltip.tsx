'use client'

import * as React from 'react'
import { motion, useTransform, AnimatePresence, useMotionValue, useSpring } from 'motion/react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'


function AnimatedTooltip({ items, className, trigger }: { items: any[]; className?: string, trigger: React.ReactElement[] }) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
  const springConfig = { stiffness: 100, damping: 5 }
  const x = useMotionValue(0)

  const rotate = useSpring(useTransform(x, [-100, 100], [-45, 45]), springConfig)
  const translateX = useSpring(useTransform(x, [-100, 100], [-50, 50]), springConfig)

  const handleMouseMove = (event: any) => {
    const halfWidth = event.target.offsetWidth / 2
    x.set(event.nativeEvent.offsetX - halfWidth)
  }

  return (
    <>
      {items.map((item, index) => (
        <div
          className={cn('relative', className)}
          key={item.name}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === index && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: 'spring',
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={{ opacity: 0, y: -20, scale: 0.6 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: 'nowrap',
                }}
                className="absolute left-1/2 top-full z-50 mt-2 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-primary px-4 py-2 text-xs text-primary-foreground shadow-xl"
              >
                {item}
              </motion.div>
            )}
          </AnimatePresence>

          {trigger[index]}
        </div>
      ))}
    </>
  )
}

export { AnimatedTooltip }