// components/shortcuts-help.tsx
"use client";

import { useState, useEffect } from "react";
import { Keyboard, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const GLOBAL_SHORTCUTS: Shortcut[] = [
  {
    keys: ['Ctrl', 'D'],
    description: 'Go to Dashboard',
    category: 'Navigation'
  },
  {
    keys: ['Ctrl', 'S'],
    description: 'Go to Sales',
    category: 'Navigation'
  },
  {
    keys: ['Ctrl', 'P'],
    description: 'Go to Purchases',
    category: 'Navigation'
  },
  {
    keys: ['Ctrl', 'I'],
    description: 'Go to Inventory',
    category: 'Navigation'
  },
  {
    keys: ['Ctrl', 'E'],
    description: 'Go to Expenses',
    category: 'Navigation'
  },
  {
    keys: ['?'],
    description: 'Show this help',
    category: 'Help'
  }
];

const INVENTORY_SHORTCUTS: Shortcut[] = [
  {
    keys: ['Ctrl', 'Q'],
    description: 'Quick Add Product',
    category: 'Inventory'
  },
  {
    keys: ['Ctrl', 'N'],
    description: 'Focus traditional form',
    category: 'Inventory'
  },
  {
    keys: ['Enter'],
    description: 'Next field / Submit',
    category: 'Forms'
  },
  {
    keys: ['Ctrl', 'Enter'],
    description: 'Quick submit',
    category: 'Forms'
  },
  {
    keys: ['Tab'],
    description: 'Navigate between fields',
    category: 'Forms'
  }
];

interface ShortcutsHelpProps {
  page?: 'inventory' | 'sales' | 'purchases' | 'expenses';
}

export function ShortcutsHelp({ page }: ShortcutsHelpProps) {
  const [open, setOpen] = useState(false);
  const [showFloatingHint, setShowFloatingHint] = useState(true);

  // Cerrar hint después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFloatingHint(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // Helper function para detectar elementos editables
  const isEditableElement = (element: Element | null): boolean => {
    if (!element) return false;
    
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return true;
    }
    
    if (element instanceof HTMLElement && element.contentEditable === 'true') {
      return true;
    }
    
    if (element.getAttribute('contenteditable') === 'true') {
      return true;
    }
    
    return false;
  };

  // Escuchar tecla '?' para abrir ayuda
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        // Solo si no estamos en un input
        const activeElement = document.activeElement;
        const isInputActive = isEditableElement(activeElement);
        
        if (!isInputActive) {
          e.preventDefault();
          setOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Obtener shortcuts específicos de la página
  const getPageShortcuts = (): Shortcut[] => {
    switch (page) {
      case 'inventory':
        return INVENTORY_SHORTCUTS;
      // Agregar más páginas aquí en el futuro
      default:
        return [];
    }
  };

  const pageShortcuts = getPageShortcuts();
  const allShortcuts = [...GLOBAL_SHORTCUTS, ...pageShortcuts];

  // Agrupar por categoría
  const shortcutsByCategory = allShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const KeyBadge = ({ keys }: { keys: string[] }) => (
    <div className="flex items-center gap-1 flex-shrink-0">
      {keys.map((key, index) => (
        <span key={index} className="flex items-center">
          <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 touch-manipulation">
            {key}
          </Badge>
          {index < keys.length - 1 && <span className="mx-1 text-muted-foreground text-xs">+</span>}
        </span>
      ))}
    </div>
  );

  return (
    <>
      {/* Floating hint */}
      {showFloatingHint && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 max-w-[calc(100vw-2rem)]">
          <Card className="border-2 border-primary/20 bg-primary/5 shadow-brutal-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md flex-shrink-0">
                <Keyboard className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Keyboard shortcuts available</p>
                <p className="text-xs text-muted-foreground hidden sm:block">Press ? for help</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 touch-manipulation"
                onClick={() => setShowFloatingHint(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-border shadow-brutal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these shortcuts to navigate and work faster. Press Esc to close.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  {category === 'Navigation' && <Zap className="h-4 w-4" />}
                  {category === 'Forms' && <Keyboard className="h-4 w-4" />}
                  {category === 'Inventory' && <Zap className="h-4 w-4" />}
                  {category === 'Help' && <Keyboard className="h-4 w-4" />}
                  {category}
                </h3>
                <div className="space-y-3">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/50 rounded-md gap-2">
                      <span className="text-sm flex-1">{shortcut.description}</span>
                      <KeyBadge keys={shortcut.keys} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Shortcuts work when you're not typing in form fields</li>
              <li>• Use Tab to navigate between form fields quickly</li>
              <li>• Ctrl + Enter works in most forms for quick submit</li>
              {page === 'inventory' && (
                <li>• Use templates in Quick Add for faster product entry</li>
              )}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}