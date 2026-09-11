/**
 * Generic "open/close a dropdown, close it on outside click or Escape"
 * behavior - the PHP app's app.js implemented this same pattern three
 * separate times (top-bar user menu, sidebar user menu, per-row kebab
 * menus), each with its own copy-pasted click/keydown listeners. Here
 * it's one hook any dropdown component can use.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDismissableMenu<T extends HTMLElement = HTMLDivElement>() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<T>(null);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((current) => !current), []);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  return { isOpen, toggle, close, containerRef };
}
