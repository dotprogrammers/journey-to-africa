"use client"

import { GooeyToaster } from "goey-toast"
import "goey-toast/styles.css"

interface GooeyToastProps {
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"
  duration?: number
  theme?: "light" | "dark"
  spring?: boolean
  bounce?: number
  showProgress?: boolean
  closeOnEscape?: boolean
  gap?: number
  offset?: number | string
  preset?: "smooth" | "bouncy" | "subtle" | "snappy"
  maxQueue?: number
}

export function GooeyToast({
  position = "top-right",
  duration = 4000,
  theme = "dark",
  spring = true,
  bounce = 0.4,
  showProgress = false,
  closeOnEscape = true,
  gap = 14,
  offset = "24px",
  preset,
  maxQueue,
}: GooeyToastProps) {
  return (
    <GooeyToaster
      position={position}
      duration={duration}
      theme={theme}
      spring={spring}
      bounce={bounce}
      showProgress={showProgress}
      closeOnEscape={closeOnEscape}
      gap={gap}
      offset={offset}
      preset={preset}
      maxQueue={maxQueue}
    />
  )
}
