import { gooeyToast as rawToast } from "goey-toast"

export type GooeyToastType = "default" | "success" | "error" | "warning" | "info"

export interface GooeyToastAction {
  label: string
  onClick: () => void
  successLabel?: string
}

export interface GooeyToastOptions {
  description?: string | React.ReactNode
  action?: GooeyToastAction
  duration?: number
  id?: string | number
  fillColor?: string
  borderColor?: string
  spring?: boolean
  bounce?: number
  showProgress?: boolean
  preset?: "smooth" | "bouncy" | "subtle" | "snappy"
  onDismiss?: (id: string | number) => void
  onAutoClose?: (id: string | number) => void
}

export interface GooeyToastPromiseOptions<T = unknown> {
  loading: string
  success: string
  error: string
  description?: {
    loading?: string | React.ReactNode
    success?: string | React.ReactNode
    error?: string | React.ReactNode
  }
  action?: {
    loading?: GooeyToastAction
    success?: GooeyToastAction
    error?: GooeyToastAction
  }
  duration?: number
}

export const gooeyToast = {
  default: (message: string, options?: GooeyToastOptions) =>
    rawToast(message, options),

  success: (message: string, options?: GooeyToastOptions) =>
    rawToast.success(message, options),

  error: (message: string, options?: GooeyToastOptions) =>
    rawToast.error(message, options),

  warning: (message: string, options?: GooeyToastOptions) =>
    rawToast.warning(message, options),

  info: (message: string, options?: GooeyToastOptions) =>
    rawToast.info(message, options),

  promise: <T>(
    promise: Promise<T>,
    options: GooeyToastPromiseOptions<T>
  ) => {
    return rawToast.promise(promise, options)
  },

  dismiss: (id?: string | number | { type: GooeyToastType | GooeyToastType[] }) => {
    rawToast.dismiss(id)
  },

  update: (id: string | number, options: {
    title?: string
    description?: React.ReactNode
    type?: GooeyToastType
    action?: GooeyToastAction
  }) => {
    rawToast.update(id, options)
  },
}
