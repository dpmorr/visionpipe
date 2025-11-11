import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parseISO } from 'date-fns';
import { WastePoint } from '../types';

interface PickupSchedule {
  id: number;
  date: string;
  wasteTypes: string[];
  wastePointId: number;
  wastePoint?: WastePoint;
}

interface EditPickupModalProps {
  open: boolean;
  onClose: () => void;
  pickup: PickupSchedule | null;
  onSave: (data: PickupSchedule) => void;
}

export function EditPickupModal({ open, onClose, pickup, onSave }: EditPickupModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [wastePointId, setWastePointId] = useState<number>(0);

  useEffect(() => {
    if (pickup) {
      setSelectedDate(parseISO(pickup.date));
      setWastePointId(pickup.wastePointId);
    }
  }, [pickup]);

  const handleSave = () => {
    if (!pickup || !selectedDate) return;

    onSave({
      ...pickup,
      date: format(selectedDate, 'yyyy-MM-dd'),
      wastePointId,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Pickup Schedule</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />

          <FormControl fullWidth required>
            <InputLabel>Waste Point</InputLabel>
            <Select
              value={wastePointId}
              onChange={(e) => setWastePointId(Number(e.target.value))}
              label="Waste Point"
            >
              {pickup?.wastePoint && (
                <MenuItem value={pickup.wastePoint.id}>
                  {pickup.wastePoint.process_step} - {pickup.wastePoint.wasteType} ({pickup.wastePoint.vendor})
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
} 