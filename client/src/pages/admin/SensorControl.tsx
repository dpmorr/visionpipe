import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Stack,
  Chip,
  IconButton,
  InputAdornment,
  Alert,
  AlertTitle,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Storage as StorageIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Terminal as TerminalIcon,
  Code as CodeIcon,
  ContentCopy as ContentCopyIcon,
  PlayArrow as PlayArrowIcon,
  Description as DescriptionIcon,
  ExpandMore as ExpandMoreIcon,
  RestartAlt as RestartAltIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/hooks/use-toast';

interface Sensor {
  id: number;
  name: string;
  type: string;
  location?: string;
  status: string;
  connectionStatus: 'connected' | 'disconnected';
  accessCode?: string;
  hostname?: string;
  ipAddress?: string;
  username?: string;
  lastUpdated?: Date;
}

interface SensorScript {
  name: string;
  description: string;
  command: string;
}

const SensorControl: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [command, setCommand] = useState('');
  const [commandOutput, setCommandOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all sensors
  const { data: sensors, isLoading, isError } = useQuery({
    queryKey: ['/api/sensors'],
    queryFn: async () => {
      const response = await axios.get('/api/sensors');
      return response.data as Sensor[];
    }
  });

  // Connect to a sensor via SSH
  const connectMutation = useMutation({
    mutationFn: async (data: { id: number; accessCode: string }) => {
      const response = await axios.post(`/api/admin/sensors/${data.id}/connect`, {
        accessCode: data.accessCode
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sensors'] });
      setConnectDialogOpen(false);
      setAccessCode('');
      setError(null);
      toast({
        title: "Connected",
        description: `Successfully connected to sensor ${selectedSensor?.name}`,
      });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to connect to sensor');
    }
  });

  // Disconnect from a sensor
  const disconnectMutation = useMutation({
    mutationFn: async (sensorId: number) => {
      const response = await axios.post(`/api/admin/sensors/${sensorId}/disconnect`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sensors'] });
      setError(null);
      toast({
        title: "Disconnected",
        description: `Successfully disconnected from sensor ${selectedSensor?.name}`,
      });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to disconnect from sensor');
    }
  });

  // Reboot a sensor
  const rebootMutation = useMutation({
    mutationFn: async (sensorId: number) => {
      const response = await axios.post(`/api/admin/sensors/${sensorId}/reboot`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sensors'] });
      setError(null);
      toast({
        title: "Reboot Initiated",
        description: `Sensor ${selectedSensor?.name} is rebooting`,
      });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to reboot sensor');
    }
  });

  // Execute a command on a sensor
  const executeMutation = useMutation({
    mutationFn: async (data: { sensorId: number; command: string }) => {
      const response = await axios.post(`/api/admin/sensors/${data.sensorId}/command`, {
        command: data.command
      });
      return response.data;
    },
    onSuccess: (data) => {
      setCommandOutput(data.output);
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to execute command');
      setCommandOutput(null);
    }
  });

  const handleConnect = () => {
    if (selectedSensor) {
      connectMutation.mutate({ id: selectedSensor.id, accessCode });
    }
  };

  const handleDisconnect = () => {
    if (selectedSensor) {
      disconnectMutation.mutate(selectedSensor.id);
    }
  };

  const handleReboot = () => {
    if (selectedSensor && window.confirm(`Are you sure you want to reboot ${selectedSensor.name}?`)) {
      rebootMutation.mutate(selectedSensor.id);
    }
  };

  const handleExecuteCommand = () => {
    if (selectedSensor && command.trim()) {
      executeMutation.mutate({ sensorId: selectedSensor.id, command });
    }
  };

  const handleOpenConnectDialog = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setConnectDialogOpen(true);
    setError(null);
  };

  const handleOpenCommandDialog = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setCommandDialogOpen(true);
    setCommandOutput(null);
    setError(null);
  };

  const handleCloseDialog = () => {
    setConnectDialogOpen(false);
    setCommandDialogOpen(false);
    setError(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConnectionStatusColor = (status: string) => {
    return status === 'connected' ? 'success' : 'default';
  };

  const renderSensorsList = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (isError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load sensors. Please try again.
        </Alert>
      );
    }

    if (!sensors || sensors.length === 0) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          No sensors found. Add sensors in the Sensors page first.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {sensors.map((sensor) => (
          <Grid item xs={12} md={6} lg={4} key={sensor.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <StorageIcon color="primary" />
                  <Typography variant="h6" component="div">
                    {sensor.name}
                  </Typography>
                </Stack>
                
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Chip 
                    label={sensor.type} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={sensor.status} 
                    size="small" 
                    color={getStatusColor(sensor.status) as any} 
                  />
                  <Chip 
                    icon={sensor.connectionStatus === 'connected' ? <LinkIcon /> : <LinkOffIcon />}
                    label={sensor.connectionStatus} 
                    size="small" 
                    color={getConnectionStatusColor(sensor.connectionStatus) as any} 
                  />
                </Stack>
                
                {sensor.location && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Location: {sensor.location}
                  </Typography>
                )}
                
                {sensor.lastUpdated && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Last Updated: {new Date(sensor.lastUpdated).toLocaleString()}
                  </Typography>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Stack direction="row" spacing={1} justifyContent="space-between">
                  {sensor.connectionStatus === 'connected' ? (
                    <>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        startIcon={<TerminalIcon />}
                        onClick={() => handleOpenCommandDialog(sensor)}
                      >
                        Execute Command
                      </Button>
                      <Stack direction="row" spacing={1}>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDisconnect()}
                          disabled={selectedSensor?.id !== sensor.id}
                        >
                          <LinkOffIcon />
                        </IconButton>
                        <IconButton 
                          color="warning" 
                          onClick={() => handleReboot()}
                          disabled={selectedSensor?.id !== sensor.id}
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Stack>
                    </>
                  ) : (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<LinkIcon />}
                      onClick={() => handleOpenConnectDialog(sensor)}
                      fullWidth
                    >
                      Connect
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Connection dialog
  const renderConnectDialog = () => (
    <Dialog 
      open={connectDialogOpen} 
      onClose={handleCloseDialog}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Connect to Sensor: {selectedSensor?.name}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the access code for this sensor to establish a secure SSH connection via Tailscale.
        </Typography>
        <TextField
          label="Access Code"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          fullWidth
          margin="dense"
          type="password"
          autoFocus
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small">
                  <CodeIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button 
          onClick={handleConnect} 
          color="primary" 
          variant="contained"
          disabled={!accessCode.trim() || connectMutation.isPending}
          startIcon={connectMutation.isPending ? <CircularProgress size={20} /> : <LinkIcon />}
        >
          {connectMutation.isPending ? 'Connecting...' : 'Connect'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Command execution dialog
  const renderCommandDialog = () => (
    <Dialog 
      open={commandDialogOpen} 
      onClose={handleCloseDialog}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Execute Command on {selectedSensor?.name}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Commands:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Chip 
              label="ls" 
              variant="outlined" 
              onClick={() => setCommand('ls -la')} 
              clickable 
            />
            <Chip 
              label="df -h" 
              variant="outlined" 
              onClick={() => setCommand('df -h')} 
              clickable 
            />
            <Chip 
              label="systemctl status" 
              variant="outlined" 
              onClick={() => setCommand('systemctl status sensor-service')} 
              clickable 
            />
            <Chip 
              label="cat config" 
              variant="outlined" 
              onClick={() => setCommand('cat sensors.conf')} 
              clickable 
            />
            <Chip 
              label="ping test" 
              variant="outlined" 
              onClick={() => setCommand('ping -c 4 8.8.8.8')} 
              clickable 
            />
          </Stack>
        </Box>
        
        <TextField
          label="Command"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          fullWidth
          margin="dense"
          autoFocus
          placeholder="Enter command to execute on the sensor"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                  $
                </Typography>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <Button 
          onClick={handleExecuteCommand} 
          color="primary" 
          variant="contained"
          disabled={!command.trim() || executeMutation.isPending}
          startIcon={executeMutation.isPending ? <CircularProgress size={20} /> : <SendIcon />}
          sx={{ mb: 2 }}
        >
          {executeMutation.isPending ? 'Executing...' : 'Execute'}
        </Button>
        
        {commandOutput && (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              mt: 2, 
              bgcolor: 'grey.900',
              position: 'relative'
            }}
          >
            <IconButton 
              size="small" 
              sx={{ position: 'absolute', top: 8, right: 8 }}
              onClick={() => {
                navigator.clipboard.writeText(commandOutput);
                toast({
                  title: "Copied",
                  description: "Command output copied to clipboard",
                });
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="body2"
              component="pre"
              sx={{
                fontFamily: 'monospace',
                color: 'grey.300',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {commandOutput}
            </Typography>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  // Fetch predefined scripts
  const { data: predefinedScripts } = useQuery<SensorScript[]>({
    queryKey: ['/api/admin/sensors/scripts'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/admin/sensors/scripts');
        return response.data.scripts;
      } catch (error) {
        console.error('Error fetching predefined scripts:', error);
        return [];
      }
    },
    enabled: !!selectedSensor && selectedSensor.connectionStatus === 'connected'
  });

  // Execute a predefined script
  const executeScript = (command: string) => {
    if (selectedSensor) {
      setCommand(command);
      executeMutation.mutate({ sensorId: selectedSensor.id, command });
    }
  };

  // Render predefined scripts section
  const renderPredefinedScripts = () => {
    if (!predefinedScripts || predefinedScripts.length === 0) {
      return <Typography variant="body2" color="text.secondary">No predefined scripts available.</Typography>;
    }

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <DescriptionIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2">Predefined Scripts</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {predefinedScripts.map((script, index) => (
              <ListItem 
                key={index}
                secondaryAction={
                  <Tooltip title="Run script">
                    <IconButton 
                      edge="end" 
                      onClick={() => executeScript(script.command)}
                      disabled={!selectedSensor || selectedSensor.connectionStatus !== 'connected' || executeMutation.isPending}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemIcon>
                  <CodeIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={script.name} 
                  secondary={script.description}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Sensor Control"
        subtitle="Remotely manage and control waste sensors via SSH using Tailscale"
      />
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6">Sensor Management</Typography>
        </Stack>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Tailscale SSH Connection</AlertTitle>
          Connect to sensors remotely using secure Tailscale SSH connections. You can execute commands, run predefined scripts, 
          and reboot sensors as needed. Please ensure your Tailscale network is properly configured.
        </Alert>
        
        {renderSensorsList()}
      </Paper>
      
      {selectedSensor && selectedSensor.connectionStatus === 'connected' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <TerminalIcon color="primary" />
            <Typography variant="h6">Remote Control Tools</Typography>
          </Stack>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <CodeIcon color="primary" />
                    <Typography variant="subtitle1">Quick Commands</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label="System Status" 
                      variant="outlined" 
                      onClick={() => executeScript('top -b -n 1')}
                      clickable 
                    />
                    <Chip 
                      label="Disk Usage" 
                      variant="outlined" 
                      onClick={() => executeScript('df -h')}
                      clickable 
                    />
                    <Chip 
                      label="Sensor Service" 
                      variant="outlined" 
                      onClick={() => executeScript('systemctl status sensor-service')}
                      clickable 
                    />
                    <Chip 
                      label="Network Test" 
                      variant="outlined" 
                      onClick={() => executeScript('ping -c 4 8.8.8.8')}
                      clickable 
                    />
                    <Chip 
                      label="View Logs" 
                      variant="outlined" 
                      onClick={() => executeScript('tail -n 20 /var/log/sensor.log')}
                      clickable 
                    />
                  </Stack>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<TerminalIcon />}
                    onClick={() => handleOpenCommandDialog(selectedSensor)}
                    fullWidth
                  >
                    Open Command Terminal
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <RestartAltIcon color="warning" />
                    <Typography variant="subtitle1">Maintenance Actions</Typography>
                  </Stack>
                  
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      These actions may interrupt sensor data collection. Use with caution.
                    </Typography>
                  </Alert>
                  
                  <Stack spacing={2}>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<RestartAltIcon />}
                      onClick={() => handleReboot()}
                      disabled={rebootMutation.isPending}
                    >
                      {rebootMutation.isPending ? 'Rebooting...' : 'Reboot Sensor'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<LinkOffIcon />}
                      onClick={() => handleDisconnect()}
                      disabled={disconnectMutation.isPending}
                    >
                      {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect SSH Session'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              {renderPredefinedScripts()}
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {renderConnectDialog()}
      {renderCommandDialog()}
    </Box>
  );
};

export default SensorControl;