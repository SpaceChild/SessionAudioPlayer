import { Menu, MenuItem } from '@mui/material';
import type { ContextMenuPosition } from '../types';

interface ContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
  onDelete: () => void;
}

export default function ContextMenu({
  position,
  onClose,
  onDelete,
}: ContextMenuProps) {
  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <Menu
      open={position !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        position ? { top: position.y, left: position.x } : undefined
      }
    >
      <MenuItem onClick={handleDelete}>Delete</MenuItem>
    </Menu>
  );
}
