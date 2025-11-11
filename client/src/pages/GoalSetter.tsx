import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  MenuItem,
  Button,
  Stack,
  Grid,
  DialogActions,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  alpha,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Target as TargetIcon,
  Save as SaveIcon,
  Trophy as TrophyIcon,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  type: string;
  targetPercentage: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface GoalSetterProps {
  open: boolean;
  onClose: () => void;
}

export function GoalSetter({ open, onClose }: GoalSetterProps) {
  const [formData, setFormData] = useState<FormData>({
    type: '',
    targetPercentage: '',
    description: '',
    startDate: null,
    endDate: null,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const theme = useTheme();

  const createGoal = useMutation({
    mutationFn: async (values: FormData) => {
      console.log('Submitting goal with values:', values);
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          startDate: values.startDate?.toISOString(),
          endDate: values.endDate?.toISOString(),
          targetPercentage: Number(values.targetPercentage),
          userId: 1, // TODO: Get from session
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create goal');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Success",
        description: "Goal created successfully!",
      });
      setFormData({
        type: '',
        targetPercentage: '',
        description: '',
        startDate: null,
        endDate: null,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create goal. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form with data:', formData);
    createGoal.mutate(formData);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TargetIcon />
          Set New Goal
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Goal Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <MenuItem value="recycling">Recycling Rate</MenuItem>
                  <MenuItem value="waste_reduction">Waste Reduction</MenuItem>
                  <MenuItem value="carbon">Carbon Footprint</MenuItem>
                  <MenuItem value="circular">Circular Economy</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Target Percentage"
                  value={formData.targetPercentage}
                  onChange={(e) => setFormData({ ...formData, targetPercentage: e.target.value })}
                  required
                >
                  {Array.from({ length: 11 }, (_, i) => i * 10).map(value => (
                    <MenuItem key={value} value={value}>{value}%</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Goal Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(date) => setFormData({ ...formData, startDate: date })}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      required: true 
                    } 
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Target Date"
                  value={formData.endDate}
                  onChange={(date) => setFormData({ ...formData, endDate: date })}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      required: true 
                    } 
                  }}
                  minDate={formData.startDate || undefined}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={createGoal.isPending}
            >
              Set Goal
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
}

export default GoalSetter;