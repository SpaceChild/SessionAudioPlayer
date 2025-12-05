import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import { useContextMenu } from '../hooks/useContextMenu';
import ContextMenu from './ContextMenu';
import type { TimeMark } from '../types';

interface MarksListProps {
  marks: TimeMark[];
  onMarkClick: (mark: TimeMark) => void;
  onMarkDelete: (mark: TimeMark) => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function truncateNote(note: string, maxLength: number = 50): string {
  if (note.length <= maxLength) return note;
  return note.substring(0, maxLength) + '...';
}

export default function MarksList({
  marks,
  onMarkClick,
  onMarkDelete,
}: MarksListProps) {
  const { contextMenu, handleContextMenu, handleClose } = useContextMenu();
  const [selectedMark, setSelectedMark] = React.useState<TimeMark | null>(null);

  const handleMarkContextMenu = (
    e: React.MouseEvent | React.TouchEvent,
    mark: TimeMark
  ) => {
    setSelectedMark(mark);
    handleContextMenu(e);
  };

  const handleDelete = () => {
    if (selectedMark) {
      onMarkDelete(selectedMark);
    }
  };

  if (marks.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No time marks yet. Tap the mark button to create one.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <List>
        {marks.map((mark) => (
          <ListItem
            key={mark.id}
            disablePadding
            onContextMenu={(e) => handleMarkContextMenu(e, mark)}
          >
            <ListItemButton onClick={() => onMarkClick(mark)}>
              <ListItemText
                primary={formatTime(mark.time_seconds)}
                secondary={mark.note ? truncateNote(mark.note) : 'No note'}
                primaryTypographyProps={{
                  fontWeight: 'bold',
                }}
                secondaryTypographyProps={{
                  sx: {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <ContextMenu
        position={contextMenu}
        onClose={handleClose}
        onDelete={handleDelete}
      />
    </>
  );
}
