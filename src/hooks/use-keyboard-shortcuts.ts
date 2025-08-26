// hooks/use-keyboard-shortcuts.ts
"use client";

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-provider';

interface KeyboardShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  global?: boolean; // Si es true, funciona en toda la app
  page?: string; // Página específica donde funciona
}

const shortcuts: KeyboardShortcutConfig[] = [
  {
    key: 'n',
    ctrlKey: true,
    description: 'New product (Quick Add)',
    action: () => {
      // Esta función será sobrescrita por cada página
      console.log('Quick add product shortcut');
    },
    page: 'inventory'
  },
  {
    key: 's',
    ctrlKey: true,
    description: 'New sale',
    action: () => {
      window.location.href = '/sales';
    },
    global: true
  },
  {
    key: 'p',
    ctrlKey: true,
    description: 'New purchase',
    action: () => {
      window.location.href = '/purchases';
    },
    global: true
  },
  {
    key: 'i',
    ctrlKey: true,
    description: 'Go to Inventory',
    action: () => {
      window.location.href = '/inventory';
    },
    global: true
  },
  {
    key: 'd',
    ctrlKey: true,
    description: 'Go to Dashboard',
    action: () => {
      window.location.href = '/dashboard';
    },
    global: true
  },
  {
    key: 'e',
    ctrlKey: true,
    description: 'Go to Expenses',
    action: () => {
      window.location.href = '/expenses';
    },
    global: true
  }
];

// Helper function para detectar si estamos en un campo editable
function isEditableElement(element: Element | null): boolean {
  if (!element) return false;
  
  // Check for input and textarea
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return true;
  }
  
  // Check for contentEditable - cast to HTMLElement for type safety
  if (element instanceof HTMLElement && element.contentEditable === 'true') {
    return true;
  }
  
  // Check for elements with contenteditable attribute
  if (element.getAttribute('contenteditable') === 'true') {
    return true;
  }
  
  return false;
}

export function useKeyboardShortcuts(customShortcuts: KeyboardShortcutConfig[] = []) {
  const { user } = useAuth();
  const router = useRouter();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Solo funcionar si hay usuario autenticado
    if (!user) return;

    // No activar shortcuts si estamos escribiendo en un campo editable
    const activeElement = document.activeElement;
    const isInputActive = isEditableElement(activeElement);

    if (isInputActive) return;

    // Combinar shortcuts globales con personalizados
    const allShortcuts = [...shortcuts, ...customShortcuts];
    
    for (const shortcut of allShortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!event.ctrlKey === !!shortcut.ctrlKey;
      const shiftMatches = !!event.shiftKey === !!shortcut.shiftKey;
      const altMatches = !!event.altKey === !!shortcut.altKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [user, customShortcuts]);

  useEffect(() => {
    if (!user) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, user]);

  // Función para mostrar ayuda de shortcuts
  const showShortcutsHelp = useCallback(() => {
    const helpText = shortcuts
      .filter(s => s.global)
      .map(s => {
        const keys = [];
        if (s.ctrlKey) keys.push('Ctrl');
        if (s.shiftKey) keys.push('Shift');
        if (s.altKey) keys.push('Alt');
        keys.push(s.key.toUpperCase());
        return `${keys.join(' + ')}: ${s.description}`;
      })
      .join('\n');
    
    alert(`Keyboard Shortcuts:\n\n${helpText}\n\nPress ? to show this help`);
  }, []);

  return {
    shortcuts: shortcuts.filter(s => s.global),
    showShortcutsHelp
  };
}

// Hook específico para la página de inventario
export function useInventoryShortcuts(onQuickAdd: () => void, onNewProduct: () => void) {
  const customShortcuts: KeyboardShortcutConfig[] = [
    {
      key: 'q',
      ctrlKey: true,
      description: 'Quick Add Product',
      action: onQuickAdd
    },
    {
      key: 'n',
      description: 'New Product (traditional form)',
      action: onNewProduct
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => {
        const helpText = `
Inventory Shortcuts:
Ctrl + Q: Quick Add Product
Ctrl + N: Focus on traditional form
N: Focus on product name field

Global Shortcuts:
Ctrl + D: Dashboard
Ctrl + S: Sales
Ctrl + P: Purchases  
Ctrl + E: Expenses
Ctrl + I: Inventory
        `.trim();
        alert(helpText);
      }
    }
  ];

  useKeyboardShortcuts(customShortcuts);
}