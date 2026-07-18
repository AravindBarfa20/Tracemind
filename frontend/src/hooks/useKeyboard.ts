import { useEffect } from 'react';

interface ShortcutOptions {
  meta?: boolean;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
}

export function useKeyboard(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: ShortcutOptions = {}
): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const targetKey = key.toLowerCase();
      const pressedKey = event.key.toLowerCase();
      
      const matchKey = targetKey === pressedKey;
      const matchMeta = options.meta === undefined || options.meta === (event.metaKey || event.ctrlKey); // support command or control key
      const matchCtrl = options.ctrl === undefined || options.ctrl === event.ctrlKey;
      const matchAlt = options.alt === undefined || options.alt === event.altKey;
      const matchShift = options.shift === undefined || options.shift === event.shiftKey;

      if (matchKey && matchMeta && matchCtrl && matchAlt && matchShift) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [key, callback, options]);
}
export default useKeyboard;
