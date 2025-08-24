"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useHotkeys } from "react-hotkeys-hook"
import React from "react"

export function Shortcuts() {
  const [open, setOpen] = React.useState(false)

  useHotkeys("?", () => setOpen(true), {
    preventDefault: true,
  })
  
  const shortcuts = [
    { key: "?", description: "Show this help menu" },
    { key: "n", description: "New item (in context)" },
  ]


  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Use these shortcuts to navigate and work faster.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ul className="space-y-2">
              {shortcuts.map((shortcut) => (
                <li key={shortcut.key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{shortcut.description}</span>
                  <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground opacity-100">
                    <span>{shortcut.key}</span>
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
  )
}
