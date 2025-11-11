import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

interface AddDeviceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DeviceFormData) => void;
}

interface DeviceFormData {
  name: string;
  type: string;
  wastePointId?: number;
  deviceToken?: string;
  deviceId?: string;
}

export default function AddDeviceModal({ open, onClose, onSubmit }: AddDeviceModalProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<DeviceFormData>();

  // Fetch waste points for the dropdown
  const { data: wastePoints } = useQuery({
    queryKey: ['/api/waste-points'],
    queryFn: async () => {
      const response = await fetch('/api/waste-points');
      if (!response.ok) {
        throw new Error('Failed to fetch waste points');
      }
      return response.json();
    },
  });

  const handleFormSubmit = (data: DeviceFormData) => {
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Device</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Device ID"
              {...register('deviceId', { required: 'Device ID is required' })}
              error={!!errors.deviceId}
              helperText={errors.deviceId?.message || 'Unique identifier for the device'}
              fullWidth
            />
            <TextField
              label="Device Token"
              {...register('deviceToken', { required: 'Device token is required' })}
              error={!!errors.deviceToken}
              helperText={errors.deviceToken?.message || 'Unique token for the device'}
              fullWidth
            />
            <TextField
              label="Device Name"
              {...register('name', { required: 'Device name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
              fullWidth
            />
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Device Type</InputLabel>
              <Select
                label="Device Type"
                {...register('type', { required: 'Device type is required' })}
              >
                <MenuItem value="sensor">Sensor</MenuItem>
                <MenuItem value="camera">Camera</MenuItem>
                <MenuItem value="gateway">Gateway</MenuItem>
                <MenuItem value="controller">Controller</MenuItem>
              </Select>
              {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Associated Waste Point</InputLabel>
              <Controller
                name="wastePointId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Associated Waste Point"
                    {...field}
                    value={field.value || ''}
                  >
                    {wastePoints?.map((point: any) => (
                      <MenuItem key={point.id} value={point.id}>
                        {point.process_step} - {point.wasteType}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Add Device</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 