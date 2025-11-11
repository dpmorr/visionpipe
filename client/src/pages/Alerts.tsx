import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const alertTypes = [
  'Sensor Offline',
  'High Fill Level',
  'Low Battery',
  'Missed Pickup',
  'Custom',
];
const notificationMethods = ['Email', 'SMS', 'In-app'];

export default function Alerts() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  // Fetch alerts
  const { data: alerts = [], isLoading: alertsLoading, error: alertsError } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: async () => {
      const res = await fetch('/api/alerts');
      if (!res.ok) throw new Error('Failed to fetch alerts');
      return res.json();
    },
  });
  // Fetch sensors
  const { data: sensors = [] } = useQuery({
    queryKey: ['/api/devices'],
    queryFn: async () => {
      const res = await fetch('/api/devices');
      if (!res.ok) throw new Error('Failed to fetch sensors');
      return res.json();
    },
  });
  // Fetch waste points
  const { data: wastePoints = [] } = useQuery({
    queryKey: ['/api/waste-points'],
    queryFn: async () => {
      const res = await fetch('/api/waste-points');
      if (!res.ok) throw new Error('Failed to fetch waste points');
      return res.json();
    },
  });

  // Debug logging
  console.log('[ALERTS PAGE RENDER]');
  console.log('alertsLoading:', alertsLoading);
  console.log('alertsError:', alertsError);
  console.log('alerts:', alerts);

  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: '',
    targetType: '',
    targetId: '',
    condition: '',
    threshold: '',
    notification: '',
    active: true,
  });
  const [editId, setEditId] = useState<number | null>(null);

  // Mutations
  const createAlert = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create alert');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      setDialogOpen(false);
    },
  });
  const updateAlert = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update alert');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      setDialogOpen(false);
    },
  });
  const deleteAlert = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete alert');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });

  // Handlers
  const handleOpenDialog = (alert?: any) => {
    console.log('[ALERTS] Opening dialog for alert:', alert);
    if (alert) {
      setForm({
        name: alert.name,
        type: alert.type,
        targetType: alert.targetType,
        targetId: alert.targetId?.toString() || '',
        condition: alert.condition,
        threshold: alert.threshold,
        notification: alert.notificationMethod,
        active: alert.active,
      });
      setEditId(alert.id);
    } else {
      setForm({ name: '', type: '', targetType: '', targetId: '', condition: '', threshold: '', notification: '', active: true });
      setEditId(null);
    }
    setDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setForm({ name: '', type: '', targetType: '', targetId: '', condition: '', threshold: '', notification: '', active: true });
    setEditId(null);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name as string]: value as string }));
    if (name === 'targetType') {
      setForm((prev) => ({ ...prev, targetId: '' }));
    }
  };
  const handleSave = () => {
    const payload = {
      name: form.name,
      type: form.type,
      targetType: form.targetType,
      targetId: form.targetId ? Number(form.targetId) : null,
      condition: form.condition,
      threshold: form.threshold,
      notificationMethod: form.notification,
      active: form.active,
    };
    if (editId !== null) {
      updateAlert.mutate({ id: editId, ...payload });
    } else {
      createAlert.mutate(payload);
    }
  };
  const handleDelete = (id: number) => {
    if (window.confirm('Delete this alert?')) {
      deleteAlert.mutate(id);
    }
  };

  // Options for target selection
  type Option = { value: string | number; label: string };
  const targetOptions: Option[] = form.targetType === 'sensor'
    ? sensors.map((s: any) => ({ value: s.id, label: s.name }))
    : form.targetType === 'waste_point'
      ? wastePoints.map((wp: any) => ({ value: wp.id, label: wp.process_step }))
      : [];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          px: 3
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            m: 0,
            p: 0
          }}
        >
          <Tabs 
            value={tab} 
            onChange={(_, v) => setTab(v)}
            sx={{ minHeight: 48 }}
            TabIndicatorProps={{ style: { height: 3, borderRadius: 2 } }}
          >
            <Tab label="Alerts List" sx={{ minHeight: 48 }} />
            <Tab label="Events" sx={{ minHeight: 48 }} />
          </Tabs>
          {tab === 0 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ m: 1 }}>
              New Alert
            </Button>
          )}
        </Box>
      </Box>
      {tab === 0 && (
        <Box sx={{ p: 3 }}>
          {alertsError && <Alert severity="error">Failed to load alerts</Alert>}
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Threshold</TableCell>
                  <TableCell>Notification</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alertsLoading ? (
                  <TableRow><TableCell colSpan={8}>Loading...</TableCell></TableRow>
                ) : alerts.length === 0 ? (
                  <TableRow><TableCell colSpan={8}>No alerts configured</TableCell></TableRow>
                ) : alerts.map((alert: any, idx: number) => (
                  <TableRow key={alert.id}>
                    <TableCell>{alert.name}</TableCell>
                    <TableCell>{alert.type}</TableCell>
                    <TableCell>
                      {alert.targetType === 'sensor'
                        ? sensors.find((s: any) => s.id === alert.targetId)?.name || 'Sensor'
                        : alert.targetType === 'waste_point'
                          ? wastePoints.find((wp: any) => wp.id === alert.targetId)?.process_step || 'Waste Point'
                          : ''}
                    </TableCell>
                    <TableCell>{alert.condition}</TableCell>
                    <TableCell>{alert.threshold}</TableCell>
                    <TableCell>{alert.notificationMethod}</TableCell>
                    <TableCell>{alert.active ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog(alert)}><EditIcon /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(alert.id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Dialog open={dialogOpen} onClose={handleCloseDialog}>
            <DialogTitle>{editId !== null ? 'Edit Alert' : 'New Alert'}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField label="Name" name="name" value={form.name} onChange={handleInputChange} fullWidth required />
                <FormControl fullWidth required>
                  <InputLabel>Type</InputLabel>
                  <Select name="type" value={form.type} label="Type" onChange={handleSelectChange}>
                    {alertTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel>Target Type</InputLabel>
                  <Select name="targetType" value={form.targetType} label="Target Type" onChange={handleSelectChange}>
                    <MenuItem value="sensor">Sensor</MenuItem>
                    <MenuItem value="waste_point">Waste Point</MenuItem>
                  </Select>
                </FormControl>
                {form.targetType && (
                  <FormControl fullWidth required>
                    <InputLabel>Target</InputLabel>
                    <Select name="targetId" value={form.targetId} label="Target" onChange={handleSelectChange}>
                      {targetOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <TextField label="Condition" name="condition" value={form.condition} onChange={handleInputChange} fullWidth required />
                <TextField label="Threshold" name="threshold" value={form.threshold} onChange={handleInputChange} fullWidth required />
                <FormControl fullWidth required>
                  <InputLabel>Notification</InputLabel>
                  <Select name="notification" value={form.notification} label="Notification" onChange={handleSelectChange}>
                    {notificationMethods.map((n) => (
                      <MenuItem key={n} value={n}>{n}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                onClick={handleSave}
                variant="contained"
                disabled={createAlert.status === 'pending' || updateAlert.status === 'pending'}
              >
                {editId !== null ? 'Update' : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
      {tab === 1 && (
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary">No events yet</Typography>
        </Box>
      )}
    </Box>
  );
} 