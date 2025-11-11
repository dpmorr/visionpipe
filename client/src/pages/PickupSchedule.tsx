import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Chip,
  Stack,
  Paper,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridValueGetter, GridValueFormatter } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { format, parseISO } from "date-fns";
import { useToast } from '../hooks/use-toast';
import { WastePoint } from '../types';
import { EditPickupModal } from '../components/EditPickupModal';

interface PickupSchedule {
  id: number;
  date: string;
  wasteTypes: string[];
  wastePointId: number;
  wastePoint?: WastePoint;
  vendor?: string;
}

interface ScheduleFormData {
  wastePointId: number;
}

interface CreateScheduleData extends ScheduleFormData {
  date: Date;
  wasteTypes: string[];
  vendor: string;
}

const initialFormData: ScheduleFormData = {
  wastePointId: 0,
};

function PickupSchedule() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedPickup, setSelectedPickup] = useState<PickupSchedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState<ScheduleFormData>(initialFormData);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery<PickupSchedule[]>({
    queryKey: ['pickup-schedules'],
    queryFn: async () => {
      const response = await fetch('/api/schedules');
      if (!response.ok) {
        throw new Error('Failed to fetch pickup schedules');
      }
      const data = await response.json();
      console.log('Fetched schedules with waste points:', data); // Debug log
      return data;
    },
  });

  const { data: wastePoints = [], isLoading: isLoadingWastePoints } = useQuery<WastePoint[]>({
    queryKey: ['waste-points'],
    queryFn: async () => {
      const response = await fetch('/api/waste-points');
      if (!response.ok) {
        throw new Error('Failed to fetch waste points');
      }
      const data = await response.json();
      console.log('Fetched waste points:', data); // Debug log
      return data;
    },
  });

  // Add debug logging for data changes
  useEffect(() => {
    console.log('Current schedules with waste points:', schedules);
    if (schedules.length > 0) {
      console.log('Sample schedule data:', schedules[0]);
      console.log('Available waste points:', wastePoints);
    }
  }, [schedules, wastePoints]);

  const createScheduleMutation = useMutation({
    mutationFn: async (data: CreateScheduleData) => {
      const payload = {
        wastePointId: data.wastePointId,
        date: data.date.toISOString(),
        wasteTypes: data.wasteTypes,
        vendor: data.vendor,
      };

      console.log('Sending payload:', payload);

      try {
        const response = await fetch('/api/schedules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        // Log the response status and headers
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        // Get the response text first
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
          throw new Error(`Server error: ${response.status} - ${responseText}`);
        }

        // Try to parse the response as JSON
        try {
          const newSchedule = JSON.parse(responseText);
          console.log('Parsed schedule:', newSchedule);
          return newSchedule;
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          throw new Error('Server returned invalid JSON response');
        }
      } catch (error) {
        console.error('Network or parsing error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickup-schedules'] });
      toast({
        title: 'Success',
        description: 'Pickup schedule created successfully',
      });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create pickup schedule',
        variant: 'destructive',
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (data: PickupSchedule) => {
      const response = await fetch(`/api/schedules/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update pickup schedule');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickup-schedules'] });
      setIsEditModalOpen(false);
      setSelectedPickup(null);
      toast({
        title: 'Success',
        description: 'Pickup schedule updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update pickup schedule',
        variant: 'destructive',
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete pickup schedule');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickup-schedules'] });
      toast({
        title: 'Success',
        description: 'Pickup schedule deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete pickup schedule',
        variant: 'destructive',
      });
    },
  });

  const handleCreateSchedule = () => {
    if (!selectedDate || !formData.wastePointId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const selectedWastePoint = wastePoints.find(p => p.id === formData.wastePointId);
    if (!selectedWastePoint) {
      toast({
        title: 'Error',
        description: 'Selected waste point not found',
        variant: 'destructive',
      });
      return;
    }

    console.log('Selected waste point:', selectedWastePoint);

    createScheduleMutation.mutate({
      wastePointId: formData.wastePointId,
      date: selectedDate,
      wasteTypes: [selectedWastePoint.wasteType],
      vendor: selectedWastePoint.vendor, // Add vendor from waste point
    });
  };

  const handleUpdatePickup = (data: PickupSchedule) => {
    updateScheduleMutation.mutate(data);
  };

  const handleDeletePickup = (id: number) => {
    if (window.confirm('Are you sure you want to delete this pickup schedule?')) {
      deleteScheduleMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedDate(null);
  };

  const columns: GridColDef<PickupSchedule>[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 200,
      renderCell: (params: any) => {
        const date = params.row.date;
        if (!date) return '';
        try {
          return format(new Date(date), 'PPP');
        } catch (error) {
          console.error('Error formatting date:', error);
          return date;
        }
      }
    },
    {
      field: 'wasteTypes',
      headerName: 'Waste Types',
      width: 200,
      renderCell: (params: any) => {
        const types = params.row.wasteTypes || [];
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {types.map((type: string) => (
              <Chip key={type} label={type} size="small" />
            ))}
          </Box>
        );
      }
    },
    {
      field: 'wastePoint',
      headerName: 'Waste Point',
      width: 250,
      renderCell: (params: any) => {
        const wastePointId = params.row.wastePointId;
        if (!wastePointId) return '';
        const wastePoint = wastePoints.find(wp => wp.id === wastePointId);
        if (!wastePoint) return '';
        return wastePoint.process_step;
      }
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 250,
      renderCell: (params: any) => {
        const wastePointId = params.row.wastePointId;
        if (!wastePointId) return '';
        const wastePoint = wastePoints.find(wp => wp.id === wastePointId);
        if (!wastePoint?.locationData?.address) return '';
        return wastePoint.locationData.address;
      }
    },
    {
      field: 'vendor',
      headerName: 'Vendor',
      width: 150,
      renderCell: (params: any) => {
        const wastePointId = params.row.wastePointId;
        if (!wastePointId) return '';
        const wastePoint = wastePoints.find(wp => wp.id === wastePointId);
        return wastePoint?.vendor || '';
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params: any) => (
        <Box>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => {
              if (params.row) {
                setSelectedPickup(params.row);
                setIsEditModalOpen(true);
              }
            }}
          >
            Edit
          </Button>
        </Box>
      )
    }
  ];

  // Add debug logging for data changes
  useEffect(() => {
    if (schedules.length > 0) {
      const sampleSchedule = schedules[0];
      console.log('Sample schedule data:', {
        id: sampleSchedule.id,
        date: sampleSchedule.date,
        wasteTypes: sampleSchedule.wasteTypes,
        wastePointId: sampleSchedule.wastePointId,
        vendor: sampleSchedule.vendor
      });
    }
  }, [schedules]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Pickup Schedule
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Schedule and manage waste pickups for your waste points
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Schedule Pickup
          </Button>
        </Box>

        <Paper sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={schedules}
            columns={columns}
            loading={isLoading || isLoadingWastePoints}
            getRowId={(row) => row.id}
            initialState={{
              pagination: { paginationModel: { pageSize: 5 } },
            }}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
          />
        </Paper>

        <Dialog
          open={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            resetForm();
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Schedule New Pickup</DialogTitle>
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
                  value={formData.wastePointId}
                  onChange={(e) => setFormData({
                    ...formData,
                    wastePointId: Number(e.target.value),
                  })}
                  label="Waste Point"
                >
                  {wastePoints.map((point) => (
                    <MenuItem key={point.id} value={point.id}>
                      {point.process_step} - {point.wasteType} ({point.vendor})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setIsCreateModalOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule} variant="contained">
              Schedule
            </Button>
          </DialogActions>
        </Dialog>

        <EditPickupModal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPickup(null);
          }}
          pickup={selectedPickup}
          onSave={handleUpdatePickup}
        />
      </Box>
    </LocalizationProvider>
  );
}

export default PickupSchedule;