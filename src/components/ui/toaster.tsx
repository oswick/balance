"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, AlertCircle, Info } from "lucide-react";

const ICONS = {
  success: <CheckCircle className="h-5 w-5 text-current" />,
  destructive: <AlertCircle className="h-5 w-5 text-current" />,
  default: <Info className="h-5 w-5 text-current" />,
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = ICONS[variant as keyof typeof ICONS] || ICONS.default;

        return (
          <Toast key={id} variant={variant} {...props}>
             <div className="flex items-start gap-3">
              <div className="flex-shrink-0 pt-0.5">{Icon}</div>
              <div className="flex-1 grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
