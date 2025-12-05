import { useState, useCallback } from 'react';
import type { ContextMenuPosition } from '../types';

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
    null
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();

      let x: number;
      let y: number;

      if ('touches' in event) {
        // Touch event (long press)
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
      } else {
        // Mouse event (right click)
        x = event.clientX;
        y = event.clientY;
      }

      setContextMenu({ x, y });
    },
    []
  );

  const handleClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  return {
    contextMenu,
    handleContextMenu,
    handleClose,
  };
}
