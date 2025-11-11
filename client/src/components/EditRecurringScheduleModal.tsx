import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';

interface EditRecurringScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { recurringInterval: number; recurringUnit: 'days' | 'weeks' | 'months' }) => void;
  currentInterval: number;
  currentUnit: 'days' | 'weeks' | 'months';
  groupId: string;
}

export default function EditRecurringScheduleModal({
  open,
  onClose,
  onSubmit,
  currentInterval,
  currentUnit,
  groupId,
}: EditRecurringScheduleModalProps) {
  const [interval, setInterval] = useState<number>(currentInterval);
  const [unit, setUnit] = useState<'days' | 'weeks' | 'months'>(currentUnit);

  useEffect(() => {
    console.log('Modal props changed:', { open, currentInterval, currentUnit, groupId });
    if (open) {
      setInterval(currentInterval);
      setUnit(currentUnit);
    }
  }, [open, currentInterval, currentUnit, groupId]);

  const handleSubmit = () => {
    console.log('Submitting form with:', { interval, unit });
    onSubmit({
      recurringInterval: interval,
      recurringUnit: unit,
    });
  };

  console.log('Rendering modal with state:', { open, interval, unit });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Edit Recurring Schedule</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Changes will be applied to all future pickups in this recurring schedule.
          </Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              type="number"
              label="Interval"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
              inputProps={{ min: 1 }}
              sx={{ width: '30%' }}
            />
            <FormControl sx={{ width: '70%' }}>
              <InputLabel>Unit</InputLabel>
              <Select
                value={unit}
                label="Unit"
                onChange={(e) => setUnit(e.target.value as 'days' | 'weeks' | 'months')}
              >
                <MenuItem value="days">Days</MenuItem>
                <MenuItem value="weeks">Weeks</MenuItem>
                <MenuItem value="months">Months</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Update Schedule
        </Button>
      </DialogActions>
    </Dialog>
  );
}