import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';

interface MarkDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  timeSeconds: number;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function MarkDialog({
  open,
  onClose,
  onSave,
  timeSeconds,
}: MarkDialogProps) {
  const [note, setNote] = useState('');

  const handleSave = () => {
    onSave(note);
    setNote('');
  };

  const handleCancel = () => {
    setNote('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>Add Time Mark at {formatTime(timeSeconds)}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={3}
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          inputProps={{ maxLength: 200 }}
          helperText={`${note.length}/200 characters`}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Mark
        </Button>
      </DialogActions>
    </Dialog>
  );
}
