import { useState, useMemo } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack,
  TextField,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  Tabs,
  Tab,
  FormHelperText,
  InputAdornment,
  CircularProgress,
  AlertTitle,
  Grid,
  Slider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Terminal as TerminalIcon,
  Code as CodeIcon,
  RestartAlt as RestartAltIcon,
  Send as SendIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  PieChart as PieChartIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import { queryClient } from '@/lib/queryClient';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import AddDeviceModal from '@/components/AddDeviceModal';

interface DeviceData {
  id: string;
  deviceId: string;
  name: string;
  type: string;
  location: string;
  status: 'active' | 'inactive' | 'error';
  iotStatus: 'connected' | 'disconnected';
  lastReading: string;
  lastReadingUnit: string;
  batteryLevel: number;
  nextMaintenance: string;
  wastePointId?: number;
  wastePoint?: {
    process_step: string;
  };
}

interface DeviceFormData {
  name: string;
  type: string;
  wastePointId?: number;
  deviceToken?: string;
  deviceId?: string;
}

interface DeviceDataPoint {
  timestamp: string;
  value: number;
  unit: string;
  fillLevel: number;
  distanceToTop: number;
  itemsDetected: Array<{
    name: string;
    confidence: number;
    count: number;
  }>;
  temperature: number;
  humidity: number;
  batteryLevel: number;
  lastCollected: string;
  processingTime: number;
  confidence: number;
  imageUrl: string;
  wasCollected?: boolean;
}

interface WastePoint {
  id: number;
  process_step: string;
  waste_type: string;
  estimated_volume: number;
  unit: string;
  vendor: string;
}

function Sensors() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceData | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [command, setCommand] = useState('');
  const [commandOutput, setCommandOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [dataTabValue, setDataTabValue] = useState(0);
  const [sensorSettings, setSensorSettings] = useState({
    timeBetweenImages: 10,
    sensitivity: 5,
    flash: false,
  });

  const { register: addFormRegister, handleSubmit: handleAddSubmit, control: addControl, formState: { errors: addErrors }, reset: resetAddForm } = useForm<DeviceFormData>();
  const { register: editFormRegister, handleSubmit: handleEditSubmit, control: editControl, formState: { errors: editErrors }, reset: resetEditForm } = useForm<DeviceFormData>();

  const { data: devices = [], isLoading } = useQuery<DeviceData[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch('/api/devices');
      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }
      const data = await response.json();
      console.log('=== DEVICES DATA FROM API ===');
      console.log('Total devices:', data.length);
      data.forEach((device: DeviceData, index: number) => {
        console.log(`\nDevice ${index + 1}:`, {
          id: device.id,
          name: device.name,
          type: device.type,
          wastePointId: device.wastePointId,
          status: device.status,
          iotStatus: device.iotStatus,
          raw: device
        });
      });
      return data;
    },
  });

  // Get unique waste point IDs from devices
  const wastePointIds = useMemo(() => {
    const ids = devices
      .filter(device => device.wastePointId)
      .map(device => device.wastePointId);
    return [...new Set(ids)]; // Remove duplicates
  }, [devices]);

  // Only fetch waste points that are actually used by devices
  const { data: wastePoints = [] } = useQuery({
    queryKey: ['wastePoints', wastePointIds],
    queryFn: async () => {
      if (wastePointIds.length === 0) return [];
      const response = await fetch(`/api/waste-points?ids=${wastePointIds.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch waste points');
      }
      return response.json();
    },
    enabled: wastePointIds.length > 0
  });

  const { data: deviceData, isLoading: isDataLoading } = useQuery<DeviceDataPoint[]>({
    queryKey: ['/api/devices', selectedDevice?.id, 'data', timeRange],
    queryFn: async ({ signal }) => {
      if (!selectedDevice) return [];
      const response = await fetch(`/api/devices/${selectedDevice.id}/data?range=${timeRange}`, { signal });
      if (!response.ok) {
        throw new Error('Failed to fetch device data');
      }
      return response.json();
    },
    enabled: !!selectedDevice,
  });

  const wastePointMap = useMemo(() => {
    return wastePoints.reduce((acc, wp) => {
      acc[wp.id] = wp;
      return acc;
    }, {} as Record<number, WastePoint>);
  }, [wastePoints]);

  const editDeviceMutation = useMutation({
    mutationFn: async (data: { id: string; deviceData: DeviceFormData }) => {
      const response = await fetch(`/api/devices/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.deviceData),
      });

      if (!response.ok) {
        throw new Error('Failed to update device');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Device updated successfully",
      });
      setIsEditDialogOpen(false);
      resetEditForm();
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addDeviceMutation = useMutation({
    mutationFn: async (deviceData: DeviceFormData) => {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deviceData.name,
          type: deviceData.type,
          waste_point_id: deviceData.wastePointId,
          device_token: deviceData.deviceToken,
          device_id: deviceData.deviceId,
          status: 'active',
          iot_status: 'disconnected'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add device');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Device added successfully",
      });
      setIsAddDialogOpen(false);
      resetAddForm();
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddDevice = (data: DeviceFormData) => {
    addDeviceMutation.mutate(data);
  };

  // Connect to a device via SSH
  const connectMutation = useMutation({
    mutationFn: async (data: { id: string; accessCode: string }) => {
      const response = await fetch(`/api/admin/devices/${data.id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: data.accessCode }),
      });
      if (!response.ok) throw new Error('Failed to connect to device');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setConnectDialogOpen(false);
      setAccessCode('');
      setError(null);
      toast({
        title: "Connected",
        description: `Successfully connected to device ${editingDevice?.name}`,
      });
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to connect to device');
    }
  });

  // Disconnect from a device
  const disconnectMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await fetch(`/api/admin/devices/${deviceId}/disconnect`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to disconnect from device');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setError(null);
      toast({
        title: "Disconnected",
        description: `Successfully disconnected from device ${editingDevice?.name}`,
      });
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to disconnect from device');
    }
  });

  // Execute a command on a device
  const executeMutation = useMutation({
    mutationFn: async (data: { deviceId: string; command: string }) => {
      const response = await fetch(`/api/admin/devices/${data.deviceId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: data.command }),
      });
      if (!response.ok) throw new Error('Failed to execute command');
      return response.json();
    },
    onSuccess: (data) => {
      setCommandOutput(data.output);
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to execute command');
      setCommandOutput(null);
    }
  });

  const handleConnect = () => {
    if (editingDevice) {
      connectMutation.mutate({ id: editingDevice.id, accessCode });
    }
  };

  const handleDisconnect = () => {
    if (editingDevice) {
      disconnectMutation.mutate(editingDevice.id);
    }
  };

  const handleExecuteCommand = () => {
    if (editingDevice && command.trim()) {
      executeMutation.mutate({ deviceId: editingDevice.id, command });
    }
  };

  const handleOpenConnectDialog = (device: DeviceData | null) => {
    if (!device) return;
    setEditingDevice(device);
    setConnectDialogOpen(true);
  };

  const handleOpenCommandDialog = (device: DeviceData | null) => {
    if (!device) return;
    setEditingDevice(device);
    setCommandDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setConnectDialogOpen(false);
    setCommandDialogOpen(false);
    setError(null);
  };

  const handleDelete = (deviceId: string) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
      }).then(() => {
        toast({
          title: "Success",
          description: "Device deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['devices'] });
      }).catch((error) => {
        toast({
          title: "Error",
          description: "Failed to delete device",
          variant: "destructive",
        });
      });
    }
  };

  const handleOpenDataDialog = (device: DeviceData) => {
    setSelectedDevice(device);
    setDataDialogOpen(true);
  };

  const handleCloseDataDialog = () => {
    setDataDialogOpen(false);
    setSelectedDevice(null);
  };

  const columns: GridColDef<DeviceData>[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'type', headerName: 'Type', flex: 1 },
    { field: 'location', headerName: 'Location', flex: 1 },
    { 
      field: 'wastePoint',
      headerName: 'Waste Point',
      flex: 1,
      renderCell: (params: GridRenderCellParams<DeviceData>) => {
        const wastePointId = params.row.wastePointId;
        if (!wastePointId) {
          return <span>Not connected</span>;
        }
        const wastePoint = wastePoints.find(wp => wp.id === wastePointId);
        return <span>{wastePoint?.process_step || 'Loading...'}</span>;
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1,
      renderCell: (params: GridRenderCellParams<DeviceData>) => (
        <Chip 
          label={params?.value || 'unknown'} 
          color={params?.value === 'active' ? 'success' : params?.value === 'inactive' ? 'warning' : 'error'} 
        />
      )
    },
    { 
      field: 'iotStatus', 
      headerName: 'IoT Status', 
      flex: 1,
      renderCell: (params: GridRenderCellParams<DeviceData>) => (
        <Chip 
          label={params?.value || 'unknown'} 
          color={params?.value === 'connected' ? 'success' : 'default'} 
        />
      )
    },
    { 
      field: 'lastReading', 
      headerName: 'Last Reading', 
      flex: 1,
      renderCell: (params: GridRenderCellParams<DeviceData>) => (
        <span>{params?.value ? `${params.value} ${params.row?.lastReadingUnit || ''}` : 'No readings'}</span>
      )
    },
    { 
      field: 'batteryLevel', 
      headerName: 'Battery', 
      flex: 1,
      renderCell: (params: GridRenderCellParams<DeviceData>) => (
        <span>{params?.value ? `${params.value}%` : 'N/A'}</span>
      )
    },
    { 
      field: 'nextMaintenance', 
      headerName: 'Next Maintenance', 
      flex: 1,
      valueFormatter: (params: { value: string | null } | null) => {
        if (!params?.value) return 'Not scheduled';
        try {
          return new Date(params.value).toLocaleDateString();
        } catch (e) {
          return 'Invalid date';
        }
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params: GridRenderCellParams<DeviceData>) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            onClick={() => handleOpenConnectDialog(params.row)}
            title="Connect"
          >
            <LinkIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleOpenCommandDialog(params.row)}
            title="Execute Command"
          >
            <TerminalIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleOpenDataDialog(params.row)}
            title="View Data"
          >
            <TimelineIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id)}
            title="Delete"
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <div>
      <Box 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          px: 3,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          m: 0,
          p: 0
        }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
          sx={{ px: 3, my: 1 }}
        >
          Add Device
        </Button>
      </Box>

      <Box sx={{ p: 3 }}>
        <DataGrid<DeviceData>
          rows={devices || []}
          columns={columns}
          autoHeight
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-cell': {
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeader': {
              bgcolor: 'background.paper',
              '&:focus': {
                outline: 'none',
              },
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                bgcolor: 'action.hover',
              },
            },
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
          loading={isLoading}
          getRowId={(row) => row.id || row.deviceId}
        />
      </Box>

      {/* Add Device Dialog */}
      <AddDeviceModal
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddDevice}
      />

      {/* Connect Dialog */}
      <Dialog
        open={connectDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Connect to Device</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              label="Access Code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              fullWidth
              helperText="Enter the device's access code to connect"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConnect} variant="contained">Connect</Button>
        </DialogActions>
      </Dialog>

      {/* Command Dialog */}
      <Dialog
        open={commandDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Execute Command</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {/* Sensor Settings Section */}
            <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
              <Typography variant="subtitle1" gutterBottom>Sensor Settings</Typography>
              <Stack spacing={2}>
                <TextField
                  label="Time Between Images (seconds)"
                  type="number"
                  value={sensorSettings.timeBetweenImages}
                  onChange={e => setSensorSettings(s => ({ ...s, timeBetweenImages: e.target.value }))}
                  fullWidth
                />
                <Box>
                  <Typography gutterBottom>Sensitivity</Typography>
                  <Slider
                    value={sensorSettings.sensitivity}
                    onChange={(_, value) => setSensorSettings(s => ({ ...s, sensitivity: value as number }))}
                    min={1}
                    max={10}
                    step={1}
                    valueLabelDisplay="auto"
                  />
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={sensorSettings.flash}
                      onChange={e => setSensorSettings(s => ({ ...s, flash: e.target.checked }))}
                    />
                  }
                  label="Flash Enabled"
                />
              </Stack>
            </Paper>
            {/* End Sensor Settings Section */}
            <TextField
              label="Command"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              fullWidth
              multiline
              rows={4}
              helperText="Enter the command to execute on the device"
            />
            {commandOutput && (
              <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'grey.100' }}>
                <Typography variant="subtitle2" gutterBottom>Output:</Typography>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{commandOutput}</pre>
              </Paper>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleExecuteCommand} variant="contained">Execute</Button>
        </DialogActions>
      </Dialog>

      {/* Data Dialog */}
      <Dialog
        open={dataDialogOpen}
        onClose={handleCloseDataDialog}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Sensor Data - {selectedDevice?.name}</Typography>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="1h">Last Hour</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {isDataLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : deviceData && deviceData.length > 0 ? (
              <>
                {/* Tabs for different views */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={dataTabValue} onChange={(_, newValue) => {
                    console.log('Tab changed to:', newValue);
                    setDataTabValue(newValue);
                  }}>
                    <Tab label="Overview" />
                    <Tab label="Contents" />
                    <Tab label="Environmental" />
                  </Tabs>
                </Box>
                {console.log('Current dataTabValue:', dataTabValue)}

                {/* Summary Cards */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {deviceData[deviceData.length - 1]?.fillLevel?.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current Fill Level
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary">
                      {deviceData[deviceData.length - 1]?.distanceToTop?.toFixed(1)}cm
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Distance to Top
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {deviceData[deviceData.length - 1]?.batteryLevel?.toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Battery Level
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {deviceData[deviceData.length - 1]?.itemsDetected?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Items Detected
                    </Typography>
                  </Paper>
                </Box>

                {/* Overview Tab */}
                {dataTabValue === 0 && (
                  <>
                    {/* Fill Level Chart */}
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Fill Level Over Time</Typography>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={deviceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="timestamp" 
                              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                            />
                            <YAxis domain={[0, 100]} />
                            <Tooltip 
                              labelFormatter={(value) => new Date(value).toLocaleString()}
                              formatter={(value: number, name: string, props: any) => [
                                `${value.toFixed(1)}%`,
                                props.payload.wasCollected ? 'Fill Level (Collected)' : 'Fill Level'
                              ]}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="fillLevel" 
                              stroke="#8884d8" 
                              strokeWidth={2}
                              dot={(props) => props.payload.wasCollected ? 
                                <circle cx={props.cx} cy={props.cy} r={4} fill="#ff0000" /> : 
                                <circle cx={props.cx} cy={props.cy} r={2} fill="#8884d8" />
                              }
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </Paper>

                    {/* Items Detected Chart */}
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Items Detected (Latest Reading)</Typography>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={deviceData[deviceData.length - 1]?.itemsDetected || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value: number, name: string, props: any) => [
                                `${value} items (${(props.payload.confidence * 100).toFixed(1)}% confidence)`,
                                name
                              ]}
                            />
                            <Bar dataKey="count" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Paper>
                  </>
                )}

                {/* Contents Tab */}
                {dataTabValue === 1 && (
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Bin Contents Analysis</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Item Type</TableCell>
                            <TableCell align="right">Count</TableCell>
                            <TableCell align="right">Confidence</TableCell>
                            <TableCell align="right">Volume Estimate</TableCell>
                            <TableCell align="right">Recyclability</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {deviceData[deviceData.length - 1]?.itemsDetected?.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box 
                                    sx={{ 
                                      width: 12, 
                                      height: 12, 
                                      borderRadius: '50%', 
                                      bgcolor: getItemColor(item.name) 
                                    }} 
                                  />
                                  {item.name}
                                </Box>
                              </TableCell>
                              <TableCell align="right">{item.count}</TableCell>
                              <TableCell align="right">{(item.confidence * 100).toFixed(1)}%</TableCell>
                              <TableCell align="right">{estimateVolume(item.name, item.count)}</TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={getRecyclability(item.name)} 
                                  size="small"
                                  color={getRecyclabilityColor(item.name)}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {/* Summary Statistics */}
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>Summary</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">Total Items</Typography>
                          <Typography variant="h6">
                            {deviceData[deviceData.length - 1]?.itemsDetected?.reduce((sum, item) => sum + item.count, 0) || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">Recyclable</Typography>
                          <Typography variant="h6" color="success.main">
                            {getRecyclablePercentage(deviceData[deviceData.length - 1]?.itemsDetected || [])}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">Non-Recyclable</Typography>
                          <Typography variant="h6" color="warning.main">
                            {getNonRecyclablePercentage(deviceData[deviceData.length - 1]?.itemsDetected || [])}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">Hazardous</Typography>
                          <Typography variant="h6" color="error.main">
                            {getHazardousPercentage(deviceData[deviceData.length - 1]?.itemsDetected || [])}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>
                )}

                {/* Environmental Tab */}
                {dataTabValue === 2 && (
                  <>
                    {/* Environmental Data */}
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Environmental Conditions</Typography>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={deviceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="timestamp" 
                              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                            />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip 
                              labelFormatter={(value) => new Date(value).toLocaleString()}
                              formatter={(value: number, name: string) => [
                                `${value.toFixed(1)}${name === 'temperature' ? '°C' : '%'}`,
                                name === 'temperature' ? 'Temperature' : 'Humidity'
                              ]}
                            />
                            <Line 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="temperature" 
                              stroke="#ff7300" 
                              strokeWidth={2}
                              dot={false}
                            />
                            <Line 
                              yAxisId="right"
                              type="monotone" 
                              dataKey="humidity" 
                              stroke="#0088fe" 
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </Paper>

                    {/* Collection Information */}
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Collection Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Last Collected:
                          </Typography>
                          <Typography variant="body1">
                            {deviceData[deviceData.length - 1]?.lastCollected ? 
                              new Date(deviceData[deviceData.length - 1].lastCollected).toLocaleString() : 
                              'Not available'
                            }
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Processing Time:
                          </Typography>
                          <Typography variant="body1">
                            {deviceData[deviceData.length - 1]?.processingTime || 0}ms
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Confidence Score:
                          </Typography>
                          <Typography variant="body1">
                            {((deviceData[deviceData.length - 1]?.confidence || 0) * 100).toFixed(1)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Readings:
                          </Typography>
                          <Typography variant="body1">
                            {deviceData.length} data points
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </>
                )}
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Data Available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This device hasn't collected any data yet. Data will appear here once the device starts transmitting.
                </Typography>
              </Box>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<AssessmentIcon />}
                onClick={() =>
                  toast({
                    title: "Coming Soon",
                    description: "Advanced analytics will be available soon",
                  })
                }
              >
                Advanced Analytics
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShowChartIcon />}
                onClick={() =>
                  toast({
                    title: "Coming Soon",
                    description: "Custom chart configurations will be available soon",
                  })
                }
              >
                Customize Chart
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDataDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

// Helper functions for the Contents tab
function getItemColor(itemName: string): string {
  const colors: Record<string, string> = {
    'Paper': '#4caf50',
    'Plastic': '#2196f3',
    'Cardboard': '#8bc34a',
    'Metal': '#ff9800',
    'Glass': '#9c27b0',
    'Organic': '#795548'
  };
  return colors[itemName] || '#757575';
}

function estimateVolume(itemName: string, count: number): string {
  const volumePerItem: Record<string, number> = {
    'Paper': 0.1, // liters
    'Plastic': 0.5,
    'Cardboard': 2.0,
    'Metal': 0.3,
    'Glass': 0.7,
    'Organic': 1.5
  };
  const volume = (volumePerItem[itemName] || 0.5) * count;
  return `${volume.toFixed(1)}L`;
}

function getRecyclability(itemName: string): string {
  const recyclability: Record<string, string> = {
    'Paper': 'Recyclable',
    'Plastic': 'Recyclable',
    'Cardboard': 'Recyclable',
    'Metal': 'Recyclable',
    'Glass': 'Recyclable',
    'Organic': 'Compostable'
  };
  return recyclability[itemName] || 'Unknown';
}

function getRecyclabilityColor(itemName: string): "success" | "warning" | "error" | "default" {
  const colors: Record<string, "success" | "warning" | "error" | "default"> = {
    'Paper': 'success',
    'Plastic': 'success',
    'Cardboard': 'success',
    'Metal': 'success',
    'Glass': 'success',
    'Organic': 'warning'
  };
  return colors[itemName] || 'default';
}

function getRecyclablePercentage(items: Array<{name: string, count: number}>): number {
  const recyclableItems = ['Paper', 'Plastic', 'Cardboard', 'Metal', 'Glass'];
  const totalItems = items.reduce((sum, item) => sum + item.count, 0);
  const recyclableCount = items
    .filter(item => recyclableItems.includes(item.name))
    .reduce((sum, item) => sum + item.count, 0);
  return totalItems > 0 ? Math.round((recyclableCount / totalItems) * 100) : 0;
}

function getNonRecyclablePercentage(items: Array<{name: string, count: number}>): number {
  const nonRecyclableItems = ['Organic'];
  const totalItems = items.reduce((sum, item) => sum + item.count, 0);
  const nonRecyclableCount = items
    .filter(item => nonRecyclableItems.includes(item.name))
    .reduce((sum, item) => sum + item.count, 0);
  return totalItems > 0 ? Math.round((nonRecyclableCount / totalItems) * 100) : 0;
}

function getHazardousPercentage(items: Array<{name: string, count: number}>): number {
  // For now, no hazardous items in the dummy data
  return 0;
}

export default Sensors;