import { useEffect, useCallback } from "react";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Early return if shortcuts are disabled
    if (!enabled) return;
    
    // Don't trigger shortcuts when interacting with interactive elements
    const target = event.target as HTMLElement;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLButtonElement ||
      target instanceof HTMLAnchorElement ||
      target?.contentEditable === "true" ||
      target?.closest('button') ||
      target?.closest('a') ||
      target?.closest('nav') ||
      target?.closest('aside') ||
      target?.closest('[role="button"]') ||
      target?.closest('[role="link"]') ||
      target?.closest('[role="navigation"]')
    ) {
      return;
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.shiftKey === event.shiftKey
      );
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      matchingShortcut.action();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    // Only add listener when enabled
    if (!enabled) return;
    
    window.addEventListener("keydown", handleKeyDown, { capture: false });
    
    return () => {
      // Always cleanup on unmount or when dependencies change
      window.removeEventListener("keydown", handleKeyDown, { capture: false });
    };
  }, [handleKeyDown, enabled]);

  return { shortcuts };
}

// Global shortcuts that work across the app
export function useGlobalKeyboardShortcuts() {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: "?",
      shiftKey: true,
      action: () => {
        // TODO: Show help modal with all shortcuts
        console.log("Show keyboard shortcuts help");
      },
      description: "Show keyboard shortcuts",
    },
  ];

  return useKeyboardShortcuts({ shortcuts });
}
