import 'reactflow/dist/style.css';
import { useState, useCallback, useEffect, memo, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { Card, Typography, Box, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Tooltip, Paper, Tabs, Tab, IconButton, Switch, FormControlLabel, Grid, Menu } from '@mui/material';
import { Add as AddIcon, Undo as UndoIcon, Save as SaveIcon, ContentCopy as CopyIcon, Edit as EditIcon, Api as ApiIcon, Delete as DeleteIcon, Map as MapIcon, Image as ImageIcon, Lock as LockIcon, Person as PersonIcon, Build as BuildIcon, DirectionsWalk as WalkIcon, LocalShipping as ShippingIcon, Storage as StorageIcon, Factory as FactoryIcon, MoreVert as MoreVertIcon, Close as CloseIcon } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { GoogleMap, LoadScript, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TableChartIcon from '@mui/icons-material/TableChart';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import CloudIcon from '@mui/icons-material/Cloud';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditNoteIcon from '@mui/icons-material/EditNote';
import FunctionsIcon from '@mui/icons-material/Functions';
import RuleIcon from '@mui/icons-material/Rule';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import type { TypographyProps } from '@mui/material';
import dagre from 'dagre';

interface WastePoint {
  id: number;
  process_step: string;
  wasteType: string;
  estimatedVolume: string;
  unit: string;
  vendor: string;
  notes: string | null;
  locationData?: {
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  };
  sensor?: {
    id: number;
    name: string;
    type: string;
    location: string;
    lastReading?: number;
    lastReadingUnit?: string;
  } | null;
}

interface WastePointData {
  id: number;
  process_step: string;
  wasteType: string;
  estimatedVolume: string;
  unit: string;
  vendor: string;
  notes: string | null;
  sensor?: {
    id: number;
    name: string;
    type: string;
    location: string;
    lastReading?: number;
    lastReadingUnit?: string;
  } | null;
  selected?: boolean;
  onEdit?: (data: WastePointData) => void;
}

// Update the ProcessBlockData interface to include all required fields
interface ProcessBlockData {
  label: string;
  type: 'person' | 'machine' | 'footTraffic' | 'shipping' | 'storage' | 'factory';
  environmentType: string;
  numberOfPeople?: number;
  people?: Array<{
    name: string;
    email: string;
  }>;
  selected?: boolean;
  onLabelChange?: (id: string, label: string) => void;
  onDelete?: (id: string) => void;
  hasSettings?: boolean;
}

// Custom Node Component for Waste Points
const WastePointNode = memo(({ data }: { data: WastePointData }) => {
  const { onEdit } = data;
  return (
    <Card
      sx={{
        width: 250,
        border: data.selected ? '2px solid #ff4d4f' : undefined,
        p: 1
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onEdit) onEdit(data);
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
      />
      <div className="flex flex-col gap-2">
        <Box
          sx={{
            backgroundColor:
              data.wasteType === 'Hazardous' ? '#ff4d4f' :
                data.wasteType === 'Recyclable' ? '#52c41a' :
                  '#1890ff',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          {data.wasteType}
        </Box>
        <Stack direction="column" spacing={1}>
          <Typography variant="body2">Volume: {data.estimatedVolume} {data.unit}</Typography>
          <Typography variant="body2">Vendor: {data.vendor}</Typography>
          {data.sensor && (
            <Box
              sx={{
                backgroundColor: '#52c41a',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              <ApiIcon sx={{ mr: 1 }} />
              {data.sensor.name}: {data.sensor.lastReading} {data.sensor.lastReadingUnit}
            </Box>
          )}
          {data.notes && (
            <Typography variant="body2" color="text.secondary">{data.notes}</Typography>
          )}
        </Stack>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
      />
    </Card>
  );
});

// Custom Process Block Node
const ProcessBlockNode = memo(({ data, id }: { data: ProcessBlockData; id: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    handleMenuClose();
    // This will be handled by the parent component
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (data.onLabelChange) {
      data.onLabelChange(id, label);
    }
  };

  const getIcon = () => {
    switch (data.type) {
      case 'person':
        return <PersonIcon />;
      case 'machine':
        return <BuildIcon />;
      case 'footTraffic':
        return <WalkIcon />;
      case 'shipping':
        return <ShippingIcon />;
      case 'storage':
        return <StorageIcon />;
      case 'factory':
        return <FactoryIcon />;
      default:
        return <AddIcon />;
    }
  };

  return (
    <Card
      sx={{
        width: 200,
        bgcolor: '#f0f5ff',
        cursor: 'pointer',
        border: isEditing ? '2px solid #1890ff' : data.selected ? '2px solid #ff4d4f' : 
                data.hasSettings ? '2px dotted #ccc' : undefined,
        p: 1,
        position: 'relative'
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
      />
      
      {/* 3-dots menu button */}
      <IconButton
        size="small"
        onClick={handleMenuClick}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          }
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Stack direction="row" spacing={1} alignItems="center">
        {getIcon()}
        {isEditing ? (
          <TextField
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (data.onLabelChange) {
                data.onLabelChange(id, e.target.value);
              }
            }}
            onBlur={handleBlur}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleBlur();
            }}
            fullWidth
          />
        ) : (
          <Typography variant="body1">{label}</Typography>
        )}
      </Stack>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
      />

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
});

// 1. Add node types for inputBlock and transformBlock
const InputBlockNode = memo(({ data, id }: { data: { label: string; type: string; selected?: boolean; onDelete?: (id: string) => void; hasSettings?: boolean }; id: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const icon = <StorageIcon color="primary" />;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    handleMenuClose();
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <Card
      sx={{ 
        width: 180, 
        bgcolor: '#e3f2fd', 
        cursor: 'pointer', 
        p: 1, 
        border: isEditing ? '2px solid #1890ff' : data.selected ? '2px solid #ff4d4f' : 
                data.hasSettings ? '2px dotted #ccc' : undefined,
        position: 'relative'
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#1976d2' }} />
      
      {/* 3-dots menu button */}
      <IconButton
        size="small"
        onClick={handleMenuClick}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          }
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Stack direction="row" spacing={1} alignItems="center">
        {icon}
        {isEditing ? (
          <TextField
            value={label}
            onChange={e => setLabel(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') setIsEditing(false); }}
            fullWidth
          />
        ) : (
          <Typography variant="body1">{label}</Typography>
        )}
      </Stack>
      <Handle type="source" position={Position.Bottom} style={{ background: '#1976d2' }} />

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
});

const TransformBlockNode = memo(({ data, id }: { data: { label: string; type: string; selected?: boolean; onDelete?: (id: string) => void; hasSettings?: boolean }; id: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const icon = <FunctionsIcon color="secondary" />;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    handleMenuClose();
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <Card
      sx={{ 
        width: 180, 
        bgcolor: '#f3e5f5', 
        cursor: 'pointer', 
        p: 1, 
        border: isEditing ? '2px solid #1890ff' : data.selected ? '2px solid #ff4d4f' : 
                data.hasSettings ? '2px dotted #ccc' : undefined,
        position: 'relative'
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#9c27b0' }} />
      
      {/* 3-dots menu button */}
      <IconButton
        size="small"
        onClick={handleMenuClick}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          }
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Stack direction="row" spacing={1} alignItems="center">
        {icon}
        {isEditing ? (
          <TextField
            value={label}
            onChange={e => setLabel(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') setIsEditing(false); }}
            fullWidth
          />
        ) : (
          <Typography variant="body1">{label}</Typography>
        )}
      </Stack>
      <Handle type="source" position={Position.Bottom} style={{ background: '#9c27b0' }} />

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
});

// 3. Update nodeTypes
const nodeTypes = {
  wastePoint: WastePointNode,
  processBlock: ProcessBlockNode,
  inputBlock: InputBlockNode,
  transformBlock: TransformBlockNode,
};

// Library Item Component
const LibraryItem = memo(({ type, label, icon, textVariant = "body2", wastePointId }: { type: string; label: string; icon: React.ReactNode; textVariant?: TypographyProps['variant']; wastePointId?: number }) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    if (wastePointId !== undefined) {
      event.dataTransfer.setData('application/reactflow', `wastePoint-${wastePointId}`);
    } else {
      event.dataTransfer.setData('application/reactflow', nodeType);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Paper
      sx={{
        p: 2,
        mb: 1,
        cursor: 'grab',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
      draggable
      onDragStart={(e) => onDragStart(e, type)}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {icon}
        <Typography variant={textVariant}>{label}</Typography>
      </Stack>
    </Paper>
  );
});

interface FlowChartProps {
  addWastePoint?: (fn: (point: WastePointData) => void) => void;
  wastePoints: WastePoint[];
  isMultiSite?: boolean;
  initialConfig?: any;
}

// 4. Update PropertiesPanel to support inputBlock and transformBlock
const PropertiesPanel = memo(({ selectedNode, nodes, setNodes }: { selectedNode: Node | null; nodes: Node[]; setNodes: (nodes: Node[]) => void }) => {
  const [tabValue, setTabValue] = useState(0);
  const [localData, setLocalData] = useState<any>(null);
  useEffect(() => {
    if (selectedNode) {
      setLocalData(selectedNode.data);
    }
  }, [selectedNode]);
  if (!selectedNode || !localData) return null;
  const handleChange = (field: string, value: any) => {
    setLocalData((prev: any) => ({ ...prev, [field]: value }));
    setNodes(nodes.map(node => node.id === selectedNode.id ? { ...node, data: { ...node.data, [field]: value } } : node));
  };
  const isInputBlock = selectedNode.type === 'inputBlock';
  const inputType = isInputBlock ? localData.type : null;
  const isTransformBlock = selectedNode.type === 'transformBlock';
  const transformType = isTransformBlock ? localData.type : null;
  return (
    <Box sx={{
      width: 320,
      bgcolor: 'background.paper',
      borderLeft: 1,
      borderColor: 'divider',
      p: 3,
      position: 'absolute',
      top: 0,
      bottom: 0,
      right: 0,
      height: 'auto',
      zIndex: 1200
    }}>
      <Typography variant="h6" gutterBottom>Properties</Typography>
      <TextField
        label="Label"
        value={localData.label || ''}
        onChange={e => handleChange('label', e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      {isInputBlock && inputType && inputBlockFields[inputType] && (
        <>
          {inputBlockFields[inputType].map(fieldDef => (
            <TextField
              key={fieldDef.field}
              label={fieldDef.label}
              type={fieldDef.type || 'text'}
              value={localData[fieldDef.field] || ''}
              onChange={e => handleChange(fieldDef.field, e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
          ))}
        </>
      )}
      {isTransformBlock && transformType && transformBlockFields[transformType] && (
        <>
          {transformBlockFields[transformType].map((fieldDef: { label: string; field: string; type?: string }) => (
            <TextField
              key={fieldDef.field}
              label={fieldDef.label}
              type={fieldDef.type || 'text'}
              value={localData[fieldDef.field] || ''}
              onChange={e => handleChange(fieldDef.field, e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
          ))}
        </>
      )}
      <Typography variant="body2" color="text.secondary">Type: {localData.type}</Typography>
    </Box>
  );
});

// Custom Map Component for Multi-site View
const WasteMap = memo(({ wastePoints, onMarkerClick }: { wastePoints: WastePoint[], onMarkerClick: (point: WastePoint) => void }) => {
  const [selectedPoint, setSelectedPoint] = useState<WastePoint | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({
    lat: -33.8688,
    lng: 151.2093
  });
  const [mapStyle, setMapStyle] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('WastePoints received:', wastePoints);
    // Find the first waste point with valid location data to center the map
    const firstLocation = wastePoints.find(point => 
      point.locationData && 
      typeof point.locationData.lat === 'number' && 
      typeof point.locationData.lng === 'number'
    )?.locationData;

    console.log('First valid location found:', firstLocation);

    if (firstLocation) {
      setMapCenter({ 
        lat: firstLocation.lat, 
        lng: firstLocation.lng 
      });
    }
  }, [wastePoints]);

  const mapContainerStyle = {
    width: '100%',
    height: '600px'
  };

  const handleMarkerClick = (point: WastePoint) => {
    setSelectedPoint(point);
    onMarkerClick(point);
  };

  const handlePlaceSelect = () => {
    if (autocomplete && map) {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        map.panTo(place.geometry.location);
        map.setZoom(15);
      }
    }
  };

  const getMarkerIcon = (wasteType: string) => {
    console.log('Getting marker icon for waste type:', wasteType);
    // Create a custom marker with a colored circle
    const color = wasteType === 'Hazardous' ? '#ff4d4f' : 
                 wasteType === 'Recyclable' ? '#52c41a' : 
                 '#1890ff';
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 12,
    };
  };

  const onLoad = (map: google.maps.Map) => {
    console.log('Map loaded successfully');
    setMap(map);
    setIsLoaded(true);
    setError(null);

    // If we have waste points, fit the map bounds to show all markers
    if (wastePoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      let hasValidPoints = false;

      wastePoints.forEach(point => {
        if (point.locationData && point.locationData.lat && point.locationData.lng) {
          bounds.extend({
            lat: point.locationData.lat,
            lng: point.locationData.lng
          });
          hasValidPoints = true;
        }
      });

      if (hasValidPoints) {
        map.fitBounds(bounds);
      } else {
        // If no valid points, set a default zoom level
        map.setZoom(13);
      }
    }
  };

  const onUnmount = () => {
    console.log('Map unmounted');
    setMap(null);
    setIsLoaded(false);
  };

  const renderMap = () => {
    console.log('Rendering map, isLoaded:', isLoaded, 'error:', error);

    if (error) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="error">Error loading map: {error}</Typography>
        </Box>
      );
    }

    // Filter waste points that have valid location data
    const validPoints = wastePoints.filter(point => 
      point.locationData && 
      typeof point.locationData.lat === 'number' && 
      typeof point.locationData.lng === 'number'
    );

    console.log('Valid points for map:', validPoints);

    if (validPoints.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography>No waste points with valid locations found.</Typography>
        </Box>
      );
    }

    return (
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapTypeId: mapStyle,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        }}
      >
        {validPoints.map((point) => {
          console.log('Rendering marker for point:', point);
          const position = {
            lat: point.locationData!.lat,
            lng: point.locationData!.lng
          };
          console.log('Marker position:', position);
          return (
            <Marker
              key={point.id}
              position={position}
              onClick={() => {
                setSelectedPoint(point);
                onMarkerClick(point);
              }}
              icon={getMarkerIcon(point.wasteType)}
              title={point.process_step}
            />
          );
        })}

        {selectedPoint && (
          <InfoWindow
            position={{
              lat: selectedPoint.locationData!.lat,
              lng: selectedPoint.locationData!.lng
            }}
            onCloseClick={() => setSelectedPoint(null)}
          >
            <Box sx={{ p: 1, minWidth: 200 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedPoint.process_step}
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Waste Type:</strong> {selectedPoint.wasteType}
                </Typography>
                <Typography variant="body2">
                  <strong>Volume:</strong> {selectedPoint.estimatedVolume} {selectedPoint.unit}
                </Typography>
                <Typography variant="body2">
                  <strong>Vendor:</strong> {selectedPoint.vendor}
                </Typography>
                {selectedPoint.notes && (
                  <Typography variant="body2">
                    <strong>Notes:</strong> {selectedPoint.notes}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {selectedPoint.locationData?.address}
                </Typography>
              </Stack>
            </Box>
          </InfoWindow>
        )}
      </GoogleMap>
    );
  };

  return (
    <Box sx={{ position: 'relative', height: '600px' }}>
      {/* Map Controls */}
      <Box sx={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        zIndex: 1, 
        bgcolor: 'background.paper',
        p: 1,
        borderRadius: 1,
        boxShadow: 1
      }}>
        <Stack spacing={1}>
          <Autocomplete
            onLoad={setAutocomplete}
            onPlaceChanged={handlePlaceSelect}
          >
            <TextField
              size="small"
              placeholder="Search location..."
              sx={{ width: 200 }}
            />
          </Autocomplete>
          <FormControl size="small">
            <Select
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value as typeof mapStyle)}
              sx={{ width: 200 }}
            >
              <MenuItem value="roadmap">Street View</MenuItem>
              <MenuItem value="satellite">Satellite</MenuItem>
              <MenuItem value="hybrid">Hybrid</MenuItem>
              <MenuItem value="terrain">Terrain</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {renderMap()}
    </Box>
  );
});

// Wrap the WasteMap component with LoadScript
const WasteMapWithScript = (props: { wastePoints: WastePoint[], onMarkerClick: (point: WastePoint) => void }) => {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        console.log('Google Maps is loaded and available');
        setIsGoogleMapsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) {
      return;
    }

    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!isGoogleMapsLoaded) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Loading Google Maps...</Typography>
      </Box>
    );
  }

  return <WasteMap {...props} />;
};

export default function FlowChart({ addWastePoint, wastePoints, isMultiSite = false, initialConfig }: FlowChartProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingWastePoint, setEditingWastePoint] = useState<WastePointData | null>(null);
  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();

  // New state for flowchart management
  const [flowcharts, setFlowcharts] = useState<FlowChart[]>([]);
  const [currentFlowchartId, setCurrentFlowchartId] = useState<string>('');
  const [newFlowchartTitle, setNewFlowchartTitle] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameTitle, setRenameTitle] = useState('');
  const [wastePointsData, setWastePointsData] = useState<WastePoint[]>(wastePoints);

  // Add background state
  const [backgroundType, setBackgroundType] = useState<'none' | 'floorplan' | 'map' | 'process'>('none');
  const [isBackgroundLocked, setIsBackgroundLocked] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [floorplanModalOpen, setFloorplanModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapLocation, setMapLocation] = useState('Sydney,Australia');
  const [mapRadius, setMapRadius] = useState(13);
  const [mapError, setMapError] = useState<string>('');
  const [mapStyle, setMapStyle] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  const [flowchartLibraryOpen, setFlowchartLibraryOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Add state for flowchart description and version
  const [flowchartDescription, setFlowchartDescription] = useState('');
  const [flowchartVersion, setFlowchartVersion] = useState('1.0.0');

  const { data: vendors = [] } = useQuery({
    queryKey: ['/api/vendors'],
  });

  // Delete node by ID (for 3-dots menu) - defined early for use in useEffect
  const deleteNodeById = useCallback((nodeId: string) => {
    setHistory((prev) => [...prev, { nodes, edges }]);
    setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
    setEdges((edges) => edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  // Check if a node has additional settings beyond just the label
  const hasNodeSettings = (node: Node) => {
    if (node.type === 'inputBlock' && node.data.type) {
      return inputBlockFields[node.data.type] && inputBlockFields[node.data.type].length > 0;
    }
    if (node.type === 'transformBlock' && node.data.type) {
      return transformBlockFields[node.data.type] && transformBlockFields[node.data.type].length > 0;
    }
    // ProcessBlock nodes don't have additional settings
    return false;
  };

  // DAGRE LAYOUT FUNCTION
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 220;
  const nodeHeight = 80;

  function layoutNodesWithDagre(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB') {
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
        sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
        targetPosition: direction === 'TB' ? Position.Top : Position.Left,
      };
    });
  }

  // Update waste point mutation
  const updateMutation = useMutation({
    mutationFn: async (data: WastePointData) => {
      const res = await fetch(`/api/waste-points/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update waste point');
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Waste Point Updated',
        description: `Successfully updated waste point for ${data.process_step}`,
      });
      setEditModalVisible(false);
    },
  });

  const hasWastePoints = wastePointsData.length > 0;

  // Load all flowcharts from localStorage
  useEffect(() => {
    const savedFlowcharts = localStorage.getItem('flowcharts');
    if (savedFlowcharts) {
      const charts = JSON.parse(savedFlowcharts);
      setFlowcharts(charts);

      // Load the last edited flowchart
      if (charts.length > 0) {
        const lastChart = charts.reduce((prev: FlowChart, current: FlowChart) =>
          new Date(prev.lastModified) > new Date(current.lastModified) ? prev : current
        );
        setCurrentFlowchartId(lastChart.id);
        loadFlowchart(lastChart);
      }
    }
  }, []);

  // Initialize nodes and edges from initialConfig if provided
  useEffect(() => {
    console.log('FlowChart initialConfig:', initialConfig);
    if (initialConfig && initialConfig.nodes && initialConfig.edges) {
      console.log('Setting nodes and edges from initialConfig:', initialConfig.nodes, initialConfig.edges);
      
      // Create a copy of nodes and edges
      const nodesCopy = initialConfig.nodes.map((node: Node) => ({ ...node }));
      const edgesCopy = initialConfig.edges.map((edge: Edge) => ({ ...edge }));
      
      // Layout nodes with dagre
      const arrangedNodes = layoutNodesWithDagre(nodesCopy, edgesCopy, 'TB');
      
      // Add handlers to the nodes from initialConfig
      const processedNodes = arrangedNodes.map((node: Node) => {
        const baseData = {
          ...node.data,
          onLabelChange: (id: string, newLabel: string) => {
            setNodes((nodes) =>
              nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n))
            );
          },
          onDelete: (id: string) => {
            deleteNodeById(id);
          },
          hasSettings: hasNodeSettings(node),
        };

        return {
          ...node,
          data: baseData,
        };
      });
      
      setNodes(processedNodes);
      setEdges(initialConfig.edges);
    } else {
      console.log('No initialConfig or missing nodes/edges');
    }
  }, [initialConfig, setNodes, setEdges]);

  // Load specific flowchart
  const loadFlowchart = (flowchart: FlowChart) => {
    // Create a copy of nodes and edges
    const nodesCopy = flowchart.nodes.map((node: Node) => ({ ...node }));
    const edgesCopy = flowchart.edges.map((edge: Edge) => ({ ...edge }));
    
    // Layout nodes with dagre
    const arrangedNodes = layoutNodesWithDagre(nodesCopy, edgesCopy, 'TB');
    
    // Update all nodes with the onLabelChange and onDelete functions
    const processNodes = arrangedNodes.map((node: Node) => {
      const baseData = {
        ...node.data,
        onLabelChange: (id: string, newLabel: string) => {
          setNodes((nodes) =>
            nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n))
          );
        },
        onDelete: (id: string) => {
          deleteNodeById(id);
        },
        hasSettings: hasNodeSettings(node),
      };

      return {
        ...node,
        data: baseData,
      };
    });

    setNodes(processNodes);
    setEdges(flowchart.edges);
  };

  // Save current flowchart
  const saveCurrentFlowchart = () => {
    const processedNodes = nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onLabelChange: undefined,
        onEdit: undefined,
      }
    }));

    const updatedFlowcharts = flowcharts.map(chart =>
      chart.id === currentFlowchartId
        ? {
          ...chart,
          nodes: processedNodes,
          edges,
          lastModified: new Date().toISOString()
        }
        : chart
    );

    setFlowcharts(updatedFlowcharts);
    localStorage.setItem('flowcharts', JSON.stringify(updatedFlowcharts));

    toast({
      title: "Flowchart Saved",
      description: "Your changes have been saved successfully",
    });
  };

  // Create new flowchart
  const handleCreateNewFlowchart = () => {
    if (!newFlowchartTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the new flowchart",
        variant: "destructive",
      });
      return;
    }

    const newFlowchart: FlowChart = {
      id: `flowchart-${Date.now()}`,
      title: newFlowchartTitle,
      nodes: [],
      edges: [],
      lastModified: new Date().toISOString()
    };

    setFlowcharts([...flowcharts, newFlowchart]);
    setCurrentFlowchartId(newFlowchart.id);
    setNodes([]);
    setEdges([]);
    setNewFlowchartTitle('');
    setCreateModalVisible(false);

    localStorage.setItem('flowcharts', JSON.stringify([...flowcharts, newFlowchart]));
  };

  const applyDagreLayout = (nodes: Node[], edges: Edge[]) => {
    const nodesCopy = nodes.map((n) => ({ ...n }));
    const edgesCopy = edges.map((e) => ({ ...e }));
    return layoutNodesWithDagre(nodesCopy, edgesCopy, 'TB');
  };

  const onNodesChangeWithHistory = useCallback((changes: any) => {
    setHistory((prev) => [...prev, { nodes, edges }]);
    let updatedNodes = nodes;
    if (changes) {
      updatedNodes = applyNodeChanges(changes, nodes);
    }
    const arrangedNodes = applyDagreLayout(updatedNodes, edges);
    setNodes(arrangedNodes);
  }, [nodes, edges, setNodes, setHistory]);

  const onEdgesChangeWithHistory = useCallback((changes: any) => {
    setHistory((prev) => [...prev, { nodes, edges }]);
    let updatedEdges = edges;
    if (changes) {
      updatedEdges = applyEdgeChanges(changes, edges);
    }
    const arrangedNodes = applyDagreLayout(nodes, updatedEdges);
    setEdges(updatedEdges);
    setNodes(arrangedNodes);
  }, [nodes, edges, setEdges, setNodes, setHistory]);

  const onConnect = useCallback((params: Connection) => {
    const newEdge = {
      ...params,
      animated: false,
      style: { stroke: '#333', strokeWidth: 2 }
    };
    const updatedEdges = addEdge(newEdge, edges);
    const arrangedNodes = applyDagreLayout(nodes, updatedEdges);
    setEdges(updatedEdges);
    setNodes(arrangedNodes);
  }, [edges, nodes, setEdges, setNodes]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      let position;
      if (nodes.length > 0) {
        const maxY = Math.max(...nodes.map(n => n.position.y));
        position = { x: 600, y: maxY + 120 };
      } else {
        position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
      }
      let newNode: Node | null = null;
      if (type.startsWith('processBlock-')) {
        const blockType = type.split('-')[1] as ProcessBlockData['type'];
        newNode = {
          id: `processBlock-${Date.now()}`,
          type: 'processBlock',
          data: {
            label: 'New Process',
            type: blockType,
            selected: false,
            onLabelChange: (id: string, newLabel: string) => {
              setNodes((nodes) =>
                nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, label: newLabel } } : node))
              );
            },
          },
          position,
        };
      } else if (type.startsWith('input-')) {
        const inputType = type.split('-')[1];
        newNode = {
          id: `inputBlock-${Date.now()}`,
          type: 'inputBlock',
          data: {
            label: `New ${inputType.charAt(0).toUpperCase() + inputType.slice(1)}`,
            type: inputType,
          },
          position,
        };
      } else if (type.startsWith('transform-')) {
        const transformType = type.split('-')[1];
        newNode = {
          id: `transformBlock-${Date.now()}`,
          type: 'transformBlock',
          data: {
            label: `New ${transformType.charAt(0).toUpperCase() + transformType.slice(1)}`,
            type: transformType,
          },
          position,
        };
      } else if (type.startsWith('wastePoint-') && !isMultiSite && wastePoints.length > 0) {
        const wastePointId = Number(type.split('-')[1]);
        const selectedWastePoint = wastePoints.find((wp) => wp.id === wastePointId);
        if (selectedWastePoint) {
          newNode = {
            id: `wastePoint-${selectedWastePoint.id}-${Date.now()}`,
            type: 'wastePoint',
            data: {
              ...selectedWastePoint,
              selected: false,
              onEdit: (data: WastePointData) => {
                if (data) {
                  setEditingWastePoint(data);
                  setEditModalVisible(true);
                }
              },
            },
            position,
          };
        }
      }
      if (newNode) {
        setNodes([...nodes, newNode]); // Do NOT run dagre layout here
      }
    }, [reactFlowInstance, setNodes, wastePoints, isMultiSite, nodes, edges]);

  // Undo last change
  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
    }
  }, [history, setNodes, setEdges]);

  // Handle edit form submission
  const handleEditSubmit = async () => {
    try {
      if (editingWastePoint?.id) {
        await updateMutation.mutateAsync({ ...editingWastePoint, id: editingWastePoint.id });
      }
    } catch (error) {
      console.error('Validation failed:', error);
      toast({
        title: "Error",
        description: "Please check all required fields and try again.",
        variant: "destructive",
      });
    }
  };

  // Delete selected node
  const deleteNode = useCallback(() => {
    if (selectedNode) {
      setHistory((prev) => [...prev, { nodes, edges }]);
      setNodes((nodes) => nodes.filter((node) => node.id !== selectedNode.id));
      setEdges((edges) => edges.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges, nodes, edges]);

  // Update onNodeClick to set the selected node
  const onNodeClick = useCallback((event: any, node: Node) => {
    setSelectedNode(node);
    setNodes((nodes) =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          selected: n.id === node.id,
        },
      }))
    );
  }, [setNodes]);

  // Add waste point to flow chart
  const addWastePointNode = useCallback((point: WastePoint) => {
    if (!currentFlowchartId) {
      toast({
        title: "Error",
        description: "Please select or create a flowchart first",
        variant: "destructive",
      });
      return;
    }

    const newNode = {
      id: `wastePoint-${point.id}`,
      type: 'wastePoint',
      data: {
        ...point,
        selected: false,
        onEdit: (data: WastePointData) => {
          if (data) {
            setEditingWastePoint(data);
            setEditModalVisible(true);
          }
        },
      },
      position: {
        x: 100 + Math.random() * 500,
        y: 100 + Math.random() * 300,
      },
    };

    setNodes((nds) => [...nds, newNode]);

    // Save the current state after adding the node
    const processedNodes = nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onLabelChange: undefined,
        onEdit: undefined,
      }
    }));

    const updatedFlowcharts = flowcharts.map(chart =>
      chart.id === currentFlowchartId
        ? {
          ...chart,
          nodes: [...processedNodes, newNode],
          edges,
          lastModified: new Date().toISOString()
        }
        : chart
    );

    setFlowcharts(updatedFlowcharts);
    localStorage.setItem('flowcharts', JSON.stringify(updatedFlowcharts));

    toast({
      title: "Node Added",
      description: `Added ${point.process_step} to the flow chart`,
    });
  }, [nodes, edges, currentFlowchartId, flowcharts, setNodes, toast]);

  // Register the addWastePointNode function with the parent component
  useEffect(() => {
    if (addWastePoint) {
      addWastePoint(addWastePointNode);
    }
  }, [addWastePoint, addWastePointNode]);

  // Rename flowchart
  const handleRename = () => {
    if (!renameTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the flowchart",
        variant: "destructive",
      });
      return;
    }

    const updatedFlowcharts = flowcharts.map(chart =>
      chart.id === currentFlowchartId
        ? {
          ...chart,
          title: renameTitle,
          lastModified: new Date().toISOString()
        }
        : chart
    );

    setFlowcharts(updatedFlowcharts);
    localStorage.setItem('flowcharts', JSON.stringify(updatedFlowcharts));
    setRenameModalVisible(false);
    setRenameTitle('');

    toast({
      title: "Flowchart Renamed",
      description: "Successfully renamed the flowchart",
    });
  };

  // Duplicate flowchart
  const handleDuplicate = () => {
    const currentChart = flowcharts.find(chart => chart.id === currentFlowchartId);
    if (!currentChart) return;

    const newFlowchart: FlowChart = {
      id: `flowchart-${Date.now()}`,
      title: `${currentChart.title} (Copy)`,
      nodes: currentChart.nodes.map(node => ({
        ...node,
        id: `${node.id}-copy-${Date.now()}`,
      })),
      edges: currentChart.edges.map(edge => ({
        ...edge,
        id: `${edge.id}-copy-${Date.now()}`,
        source: `${edge.source}-copy-${Date.now()}`,
        target: `${edge.target}-copy-${Date.now()}`,
      })),
      lastModified: new Date().toISOString()
    };

    setFlowcharts([...flowcharts, newFlowchart]);
    localStorage.setItem('flowcharts', JSON.stringify([...flowcharts, newFlowchart]));

    toast({
      title: "Flowchart Duplicated",
      description: `Created a copy of "${currentChart.title}"`,
    });
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Add style override for padding
  useEffect(() => {
    const styles = `
      .waste-flow-container .css-19kzrtu {
        padding: 0 !important;
      }
    `;
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Add background selection handlers
  const handleBackgroundChange = (type: 'none' | 'floorplan' | 'map' | 'process') => {
    setBackgroundType(type);
    switch (type) {
      case 'map':
        setMapModalOpen(true);
        break;
      case 'floorplan':
        setFloorplanModalOpen(true);
        break;
      case 'process':
        // Clear any existing background
        setBackgroundImage('');
        break;
      case 'none':
        setBackgroundImage('');
        break;
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add floor plan upload handlers
  const handleFloorplanUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadError('');
    }
  };

  const handleFloorplanSubmit = () => {
    if (!uploadedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setBackgroundImage(e.target?.result as string);
      setBackgroundType('floorplan');
      setFloorplanModalOpen(false);
      setUploadedFile(null);
    };
    reader.onerror = () => {
      setUploadError('Error reading file');
    };
    reader.readAsDataURL(uploadedFile);
  };

  // Update map configuration handler
  const handleMapSubmit = () => {
    if (!mapLocation.trim()) {
      setMapError('Please enter a location');
      return;
    }

    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(mapLocation)}&zoom=${mapRadius}&size=1200x1200&maptype=${mapStyle}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
    setBackgroundImage(mapUrl);
    setBackgroundType('map');
    setMapModalOpen(false);
    setMapError('');
  };

  // Add handler for canvas click
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setNodes((nodes) =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          selected: false,
        },
      }))
    );
  }, [setNodes]);

  // Add template flowcharts
  const templateFlowcharts = [
    {
      id: 'template-1',
      title: 'Basic Process Flow',
      description: 'A simple process flow template with basic blocks',
      nodes: [
        {
          id: 'start',
          type: 'processBlock',
          data: { label: 'Start', type: 'person' },
          position: { x: 450, y: 100 }
        },
        {
          id: 'process',
          type: 'processBlock',
          data: { label: 'Process', type: 'machine' },
          position: { x: 450, y: 250 }
        },
        {
          id: 'end',
          type: 'processBlock',
          data: { label: 'End', type: 'person' },
          position: { x: 450, y: 400 }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'start', target: 'process' },
        { id: 'e2-3', source: 'process', target: 'end' }
      ]
    },
    {
      id: 'template-2',
      title: 'Waste Management Flow',
      description: 'A template for waste management processes',
      nodes: [
        {
          id: 'collection',
          type: 'processBlock',
          data: { label: 'Waste Collection', type: 'shipping' },
          position: { x: 450, y: 100 }
        },
        {
          id: 'sorting',
          type: 'processBlock',
          data: { label: 'Sorting', type: 'machine' },
          position: { x: 450, y: 250 }
        },
        {
          id: 'storage',
          type: 'processBlock',
          data: { label: 'Storage', type: 'storage' },
          position: { x: 450, y: 400 }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'collection', target: 'sorting' },
        { id: 'e2-3', source: 'sorting', target: 'storage' }
      ]
    }
  ];

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.id);
    const newFlowchart: FlowChart = {
      id: `flowchart-${Date.now()}`,
      title: `${template.title} (Copy)`,
      nodes: template.nodes.map((node: any) => ({
        ...node,
        id: `${node.id}-${Date.now()}`,
        data: {
          ...node.data,
          onLabelChange: (id: string, newLabel: string) => {
            setNodes((nodes) =>
              nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n))
            );
          }
        }
      })),
      edges: template.edges.map((edge: any) => ({
        ...edge,
        id: `${edge.id}-${Date.now()}`,
        source: `${edge.source}-${Date.now()}`,
        target: `${edge.target}-${Date.now()}`
      })),
      lastModified: new Date().toISOString()
    };

    setFlowcharts([...flowcharts, newFlowchart]);
    setCurrentFlowchartId(newFlowchart.id);
    loadFlowchart(newFlowchart);
    setFlowchartLibraryOpen(false);
  };

  // Handle marker click in multi-site view
  const handleMarkerClick = (point: WastePoint) => {
    setEditingWastePoint(point);
    setEditModalVisible(true);
  };

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const currentChart = flowcharts.find(chart => chart.id === currentFlowchartId);
  const currentTitle = currentChart ? currentChart.title : '';
  const handleTitleEditSave = () => {
    setIsEditingTitle(false);
    if (!currentChart || editingTitle.trim() === '' || editingTitle === currentTitle) return;
    // Update the title in the flowcharts array
    const updatedFlowcharts = flowcharts.map(chart =>
      chart.id === currentFlowchartId
        ? { ...chart, title: editingTitle }
        : chart
    );
    setFlowcharts(updatedFlowcharts);
    // Also update the renameTitle if the rename dialog is open
    setRenameTitle(editingTitle);
    // Optionally, save to localStorage
    localStorage.setItem('flowcharts', JSON.stringify(updatedFlowcharts));
  };

  // On mount, if initialConfig is present, use it to initialize the flowchart state
  useEffect(() => {
    if (initialConfig && initialConfig.nodes && initialConfig.edges) {
      setNodes(initialConfig.nodes);
      setEdges(initialConfig.edges);
    }
  }, [initialConfig, setNodes, setEdges]);

  // --- VERTICAL LAYOUT STATE ---
  const [blocks, setBlocks] = useState([
    { id: 'block-1', type: 'default', data: { label: 'Default Block' }, position: { x: 0, y: 0 } }
  ]);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuBlockIndex, setMenuBlockIndex] = useState<number | null>(null);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [changeBlockIndex, setChangeBlockIndex] = useState<number | null>(null);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  // Helper to parse block type and get subtype
  function parseBlockType(type: string): { main: string; subtype?: string } {
    if (type.startsWith('input-')) return { main: 'inputBlock', subtype: type.replace('input-', '') };
    if (type.startsWith('processBlock-')) return { main: 'processBlock', subtype: type.replace('processBlock-', '') };
    if (type.startsWith('transform-')) return { main: 'transformBlock', subtype: type.replace('transform-', '') };
    return { main: type, subtype: undefined };
  }

  function getDefaultDataForBlock(type: string): { [key: string]: any } {
    const { main, subtype } = parseBlockType(type);
    let data: { [key: string]: any } = { label: '' };
    if (main === 'inputBlock' && subtype && inputBlockFields[subtype]) {
      inputBlockFields[subtype].forEach(f => { data[f.field] = ''; });
      data.type = subtype;
    } else if (main === 'transformBlock' && subtype && transformBlockFields[subtype]) {
      transformBlockFields[subtype].forEach(f => { data[f.field] = ''; });
      data.type = subtype;
    } else if (main === 'processBlock' && subtype) {
      data.type = subtype;
    }
    return data;
  }

  // Add zoom state
  const [zoom, setZoom] = useState(1);
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));

  // Helper to get default label for a block type
  function getDefaultLabelForType(type: string): string {
    const block = fullBlockLibrary.find(b => b.type === type);
    return block ? block.label : 'Block';
  }

  // Update handleAddBlock and handleChangeBlockSelect to always set label to default if blank
  const handleAddBlock = () => {
    const defaultBlock = fullBlockLibrary[0];
    setBlocks((prev) => [
      ...prev,
      {
        id: `block-${Date.now()}`,
        type: defaultBlock.type || '',
        data: { ...getDefaultDataForBlock(defaultBlock.type || ''), label: defaultBlock.label },
        position: { x: 0, y: prev.length * 100 }
      }
    ]);
  };
  const handleChangeBlockSelect = (type: string, label: string, wastePointData?: any) => {
    if (changeBlockIndex !== null) {
      setBlocks((prev) => prev.map((b, i) => {
        if (i === changeBlockIndex) {
          if (type === 'wastePoint' && wastePointData) {
            return {
              ...b,
              type: 'wastePoint',
              data: { ...wastePointData, label: label || getDefaultLabelForType('wastePoint') },
              position: b.position || { x: 0, y: i * 100 }
            };
          }
          const defaultLabel = getDefaultLabelForType(type || fullBlockLibrary[0].type || '');
          const newData = getDefaultDataForBlock(type || fullBlockLibrary[0].type || '');
          newData.label = label || defaultLabel;
          return {
            ...b,
            type: type || fullBlockLibrary[0].type || '',
            data: newData,
            position: b.position || { x: 0, y: i * 100 }
          };
        }
        return b;
      }));
      setSelectedBlockIndex(changeBlockIndex);
    }
    setChangeModalOpen(false);
    setChangeBlockIndex(null);
  };

  // Block click: select for properties
  const handleBlockClick = (idx: number) => {
    setSelectedBlockIndex(idx);
  };

  // Open 3-dots menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, index: number) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuBlockIndex(index);
  };
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuBlockIndex(null);
  };

  // Open change block modal
  const handleChangeBlock = () => {
    setChangeModalOpen(true);
    setChangeBlockIndex(menuBlockIndex);
    handleMenuClose();
  };
  const handleChangeBlockCancel = () => {
    setChangeModalOpen(false);
    setChangeBlockIndex(null);
  };

  // Use the full blockLibrary from the main file
  // (Assume blockLibrary is defined at the top level, as in your original code)

  // Update block data from PropertiesPanel
  const handleBlockDataChange = (field: string, value: any) => {
    if (selectedBlockIndex !== null) {
      setBlocks((prev) => prev.map((b, i) =>
        i === selectedBlockIndex ? { ...b, data: { ...b.data, [field]: value } } : b
      ));
    }
  };

  const fullBlockLibrary = [
    // Inputs
    { type: 'input-database', label: 'Database', icon: <StorageIcon /> },
    { type: 'input-excelonline', label: 'Excel Online', icon: <TableChartIcon /> },
    { type: 'input-feeds', label: 'Feeds', icon: <RssFeedIcon /> },
    { type: 'input-api', label: 'API', icon: <CloudIcon /> },
    { type: 'input-csvupload', label: 'CSV Upload', icon: <UploadFileIcon /> },
    { type: 'input-manualentry', label: 'Manual Entry', icon: <EditNoteIcon /> },
    // Process Blocks
    { type: 'processBlock-person', label: 'Person', icon: <PersonIcon /> },
    { type: 'processBlock-machine', label: 'Machine', icon: <BuildIcon /> },
    { type: 'processBlock-footTraffic', label: 'Foot Traffic', icon: <WalkIcon /> },
    { type: 'processBlock-shipping', label: 'Shipping', icon: <ShippingIcon /> },
    { type: 'processBlock-storage', label: 'Storage', icon: <StorageIcon /> },
    { type: 'processBlock-factory', label: 'Factory', icon: <FactoryIcon /> },
    // Transform
    { type: 'transform-logicoperations', label: 'Logic Operations', icon: <FunctionsIcon /> },
    { type: 'transform-conditions', label: 'Conditions', icon: <RuleIcon /> },
    { type: 'transform-mapping', label: 'Mapping', icon: <CompareArrowsIcon /> },
    { type: 'transform-aggregation', label: 'Aggregation', icon: <MergeTypeIcon /> },
    { type: 'transform-filtering', label: 'Filtering', icon: <FilterAltIcon /> },
  ];

  // Add menu state
  const [selectedMenu, setSelectedMenu] = useState<'details' | 'history' | 'variables'>('details');
  const [variables, setVariables] = useState<{ key: string; value: string }[]>([]);

  // Handlers for variables
  const handleAddVariable = () => setVariables((vars) => [...vars, { key: '', value: '' }]);
  const handleVariableChange = (idx: number, field: 'key' | 'value', value: string) => {
    setVariables((vars) => vars.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };
  const handleRemoveVariable = (idx: number) => {
    setVariables((vars) => vars.filter((_, i) => i !== idx));
  };

  const canvasRef = useRef<HTMLDivElement>(null);
  const blockChainRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; scrollTop: number; scrollLeft: number } | null>(null);

  // Zoom/ctrl+scroll for the main canvas
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) setZoom((z) => Math.min(z + 0.1, 2));
        else setZoom((z) => Math.max(z - 0.1, 0.5));
      }
    };
    const node = canvasRef.current;
    if (node) {
      node.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (node) {
        node.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Panning for the block chain area
  useEffect(() => {
    const blockChain = blockChainRef.current;
    if (!blockChain) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 1) { // Left or middle mouse button
        setIsPanning(true);
        setPanStart({
          x: e.clientX,
          y: e.clientY,
          scrollTop: blockChain.scrollTop,
          scrollLeft: blockChain.scrollLeft,
        });
        blockChain.style.cursor = 'grabbing';
        e.preventDefault();
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning && panStart) {
        blockChain.scrollTop = panStart.scrollTop - (e.clientY - panStart.y);
        blockChain.scrollLeft = panStart.scrollLeft - (e.clientX - panStart.x);
      }
    };
    const handleMouseUp = () => {
      setIsPanning(false);
      setPanStart(null);
      if (blockChain) blockChain.style.cursor = '';
    };
    blockChain.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      blockChain.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart]);

  if (isMultiSite) {
    return (
      <div style={{ width: '100%', height: '600px' }}>
        <WasteMapWithScript wastePoints={wastePoints} onMarkerClick={handleMarkerClick} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
      {/* Left Panel: Navigation Menu and Content */}
      <Box
        sx={{
          width: 250,
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          p: 2,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          height: '100vh',
        }}
      >
        {/* Vertical Menu */}
        <Box sx={{ mb: 2 }}>
          <Button
            fullWidth
            variant={selectedMenu === 'details' ? 'contained' : 'outlined'}
            onClick={() => setSelectedMenu('details')}
            sx={{ mb: 1 }}
          >
            Flowchart Details
          </Button>
          <Button
            fullWidth
            variant={selectedMenu === 'history' ? 'contained' : 'outlined'}
            onClick={() => setSelectedMenu('history')}
            sx={{ mb: 1 }}
          >
            Status / Run History
          </Button>
          <Button
            fullWidth
            variant={selectedMenu === 'variables' ? 'contained' : 'outlined'}
            onClick={() => setSelectedMenu('variables')}
          >
            Variables
          </Button>
        </Box>
        {/* Menu Content */}
        {selectedMenu === 'details' && (
          <>
            <Typography variant="h6" gutterBottom>Flowchart Details</Typography>
            <TextField
              label="Name"
              value={currentTitle}
              onChange={e => setEditingTitle(e.target.value)}
              onBlur={handleTitleEditSave}
              onKeyDown={e => { if (e.key === 'Enter') handleTitleEditSave(); }}
              size="small"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Description"
              value={flowchartDescription}
              onChange={e => setFlowchartDescription(e.target.value)}
              size="small"
              multiline
              minRows={2}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Version"
              value={flowchartVersion}
              onChange={e => setFlowchartVersion(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                startIcon={<CopyIcon />}
                onClick={handleDuplicate}
                size="small"
              >
                Copy
              </Button>
              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={deleteNode}
                size="small"
              >
                Delete
              </Button>
            </Stack>
          </>
        )}
        {selectedMenu === 'history' && (
          <>
            <Typography variant="h6" gutterBottom>Status / Run History</Typography>
            <Typography variant="body2" color="text.secondary">No run history yet.</Typography>
          </>
        )}
        {selectedMenu === 'variables' && (
          <>
            <Typography variant="h6" gutterBottom>Variables</Typography>
            {variables.map((v, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Key"
                  value={v.key}
                  onChange={e => handleVariableChange(idx, 'key', e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Value"
                  value={v.value}
                  onChange={e => handleVariableChange(idx, 'value', e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <IconButton onClick={() => handleRemoveVariable(idx)} size="small" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button onClick={handleAddVariable} size="small" variant="outlined" sx={{ mt: 1 }}>Add Variable</Button>
          </>
        )}
      </Box>

      {/* Flow Chart Area (vertical block chain as main content) + Properties Panel as flex children */}
      <Box
        ref={canvasRef}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          height: '100%',
          position: 'relative',
          minHeight: '100vh',
          backgroundImage: `radial-gradient(circle, #e0e0e0 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: '0px 100px',
        }}
      >
        {/* Overlay to catch clicks and close properties panel */}
        {selectedBlockIndex !== null && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1100,
              background: 'transparent',
              pointerEvents: 'auto',
            }}
            onClick={() => setSelectedBlockIndex(null)}
          />
        )}
        {/* Main vertical block chain area (no grid background here) */}
        <Box
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', pt: 0, position: 'relative' }}
          onClick={() => {
            if (selectedBlockIndex !== null) return; // Don't deselect if panel is open
            setSelectedBlockIndex(null);
          }}
        >
          {/* Top bar: title, menu, etc. (no grid background) */}
          <Box sx={{ width: '100%', borderBottom: '1px solid #e0e0e0', p: '0.5rem 1rem', mb: 2, bgcolor: 'background.paper', zIndex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Flowchart Title (editable) */}
              {currentFlowchartId && (
                isMultiSite ? null : (
                  isEditingTitle ? (
                    <TextField
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      onBlur={handleTitleEditSave}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleTitleEditSave();
                      }}
                      size="small"
                      sx={{ minWidth: 200, mr: 2 }}
                      autoFocus
                    />
                  ) : (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        variant="h6"
                        sx={{ mr: 0, cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => {
                          setEditingTitle(currentTitle);
                          setIsEditingTitle(true);
                        }}
                      >
                        {currentTitle}
                      </Typography>
                      <Tooltip title="Edit Title">
                        <IconButton size="small" onClick={() => {
                          setEditingTitle(currentTitle);
                          setIsEditingTitle(true);
                        }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )
                )
              )}
              {/* Spacer to push menu buttons to the right */}
              <Box sx={{ flexGrow: 1 }} />
              {/* Zoom controls */}
              <Button size="small" onClick={handleZoomOut} sx={{ minWidth: 32 }}>-</Button>
              <Typography variant="body2" sx={{ mx: 1 }}>{Math.round(zoom * 100)}%</Typography>
              <Button size="small" onClick={handleZoomIn} sx={{ minWidth: 32 }}>+</Button>
              {/* Toolbar Buttons */}
              <Tooltip
                title={!hasWastePoints ? "Add a waste point first before creating a new flow chart" : ""}
                arrow
              >
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateModalVisible(true)}
                    size="small"
                    disabled={!hasWastePoints}
                  >
                    New
                  </Button>
                </span>
              </Tooltip>

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveCurrentFlowchart}
                disabled={!currentFlowchartId || !hasWastePoints}
                size="small"
              >
                Save
              </Button>

              <Button
                variant="outlined"
                startIcon={<UndoIcon />}
                onClick={handleUndo}
                disabled={history.length === 0 || !hasWastePoints}
                size="small"
              >
                Undo
              </Button>

              <Tooltip title={isBackgroundLocked ? "Unlock Background" : "Lock Background"}>
                <IconButton
                  size="small"
                  onClick={() => setIsBackgroundLocked(!isBackgroundLocked)}
                  color={isBackgroundLocked ? 'primary' : 'default'}
                >
                  <LockIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          {/* Block chain area with grid background and panning */}
          <Box
            ref={blockChainRef}
            sx={{
              width: 400,
              mx: 'auto',
              mt: 2,
              position: 'relative',
              overflow: 'auto',
              height: 'calc(100vh - 120px)',
              transition: 'transform 0.2s',
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              cursor: isPanning ? 'grabbing' : 'grab',
            }}
          >
            {blocks.map((block, idx) => (
              <Box key={block.id} sx={{ position: 'relative', mb: 4 }}>
                <Card
                  sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: selectedBlockIndex === idx ? '2px solid #1976d2' : undefined }}
                  onClick={(e) => { e.stopPropagation(); handleBlockClick(idx); }}
                >
                  <Typography>{block.data.label || getDefaultLabelForType(block.type)}</Typography>
                  <IconButton onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, idx); }}>
                    <MoreVertIcon />
                  </IconButton>
                </Card>
                {/* Line and + button below each block except the last */}
                {idx === blocks.length - 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box sx={{ flex: 1, height: 2, bgcolor: 'grey.300' }} />
                    <IconButton color="primary" onClick={handleAddBlock} sx={{ mx: 1 }}>
                      <AddIcon />
                    </IconButton>
                    <Box sx={{ flex: 1, height: 2, bgcolor: 'grey.300' }} />
                  </Box>
                )}
              </Box>
            ))}
            {/* 3-dots menu */}
            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={handleChangeBlock}>Change Block</MenuItem>
              <MenuItem
                onClick={() => {
                  if (menuBlockIndex !== null) {
                    setBlocks(blocks => blocks.filter((_, idx) => idx !== menuBlockIndex));
                    setMenuAnchorEl(null);
                    setMenuBlockIndex(null);
                  }
                }}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
              </MenuItem>
            </Menu>
            {/* Change Block Modal */}
            <Dialog open={changeModalOpen} onClose={handleChangeBlockCancel}>
              <DialogTitle>Select Block Type</DialogTitle>
              <DialogContent>
                {/* Waste Points Category */}
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Waste Points</Typography>
                {wastePoints && wastePoints.length > 0 ? (
                  wastePoints.map((wp) => (
                    <Button
                      key={wp.id}
                      onClick={() => handleChangeBlockSelect('wastePoint', wp.process_step, wp)}
                      sx={{ m: 1 }}
                      variant="outlined"
                      startIcon={<ApiIcon />}
                    >
                      {wp.process_step}
                    </Button>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1, mb: 1 }}>
                    No waste points available
                  </Typography>
                )}
                {/* Inputs Category */}
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Inputs</Typography>
                {fullBlockLibrary.filter(b => b.type.startsWith('input-')).map((b) => (
                  <Button key={b.type} onClick={() => handleChangeBlockSelect(b.type, b.label)} sx={{ m: 1 }} variant="outlined" startIcon={b.icon}>
                    {b.label}
                  </Button>
                ))}
                {/* Process Blocks Category */}
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Process Blocks</Typography>
                {fullBlockLibrary.filter(b => b.type.startsWith('processBlock-')).map((b) => (
                  <Button key={b.type} onClick={() => handleChangeBlockSelect(b.type, b.label)} sx={{ m: 1 }} variant="outlined" startIcon={b.icon}>
                    {b.label}
                  </Button>
                ))}
                {/* Transform Category */}
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Transform</Typography>
                {fullBlockLibrary.filter(b => b.type.startsWith('transform-')).map((b) => (
                  <Button key={b.type} onClick={() => handleChangeBlockSelect(b.type, b.label)} sx={{ m: 1 }} variant="outlined" startIcon={b.icon}>
                    {b.label}
                  </Button>
                ))}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleChangeBlockCancel}>Cancel</Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Box>
        {/* Floating properties panel as a sibling, not inside the block column */}
        {selectedBlockIndex !== null && blocks[selectedBlockIndex] && (
          <Box
            sx={{
              width: 320,
              bgcolor: 'background.paper',
              boxShadow: 3,
              borderRadius: 2,
              p: 2,
              position: 'absolute',
              top: 140,
              right: 32,
              zIndex: 1200,
              border: '1px solid #e0e0e0',
              height: 'auto',
              minHeight: 650,
              maxHeight: '99vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'auto',
            }}
          >
            <IconButton size="large" onClick={() => setSelectedBlockIndex(null)} sx={{ color: 'error.main', fontSize: 32, position: 'absolute', top: 8, right: 8 }}>
              <CloseIcon fontSize="inherit" />
            </IconButton>
            <PropertiesPanel
              selectedNode={{
                id: blocks[selectedBlockIndex].id,
                type: parseBlockType(blocks[selectedBlockIndex].type).main,
                data: { ...blocks[selectedBlockIndex].data, label: blocks[selectedBlockIndex].data.label || getDefaultLabelForType(blocks[selectedBlockIndex].type) },
                position: blocks[selectedBlockIndex].position || { x: 0, y: selectedBlockIndex * 100 }
              }}
              nodes={blocks.map((b) => ({
                id: b.id,
                type: parseBlockType(b.type).main,
                data: { ...b.data, label: b.data.label || getDefaultLabelForType(b.type) },
                position: b.position || { x: 0, y: 0 }
              }))}
              setNodes={(newNodes) => {
                setBlocks(newNodes.map((n, i) => ({
                  id: n.id,
                  type: n.type || '',
                  data: typeof n.data === 'object' ? { ...n.data, label: (n.data && n.data.label) || getDefaultLabelForType(n.type || '') } : { label: getDefaultLabelForType(n.type || '') },
                  position: n.position || { x: 0, y: i * 100 },
                })));
              }}
            />
          </Box>
        )}
      </Box>
    </div>
  );
}

interface FlowChart {
  id: string;
  title: string;
  nodes: Node[];
  edges: Edge[];
  lastModified: string;
}

const inputBlockFields: Record<string, { label: string; field: string; type?: string }[]> = {
  database: [
    { label: 'Host', field: 'host' },
    { label: 'Port', field: 'port' },
    { label: 'Database', field: 'database' },
    { label: 'Username', field: 'username' },
    { label: 'Password', field: 'password', type: 'password' },
  ],
  excelonline: [
    { label: 'File URL', field: 'fileUrl' },
  ],
  feeds: [
    { label: 'Feed URL', field: 'feedUrl' },
  ],
  api: [
    { label: 'Endpoint URL', field: 'endpoint' },
    { label: 'Method', field: 'method' },
  ],
  csvupload: [
    { label: 'File Name', field: 'fileName' },
  ],
  manualentry: [
    { label: 'Description', field: 'description' },
  ],
};

const transformBlockFields: Record<string, { label: string; field: string; type?: string }[]> = {
  logicoperations: [
    { label: 'Expression', field: 'expression' },
  ],
  conditions: [
    { label: 'Condition', field: 'condition' },
    { label: 'True Value', field: 'trueValue' },
    { label: 'False Value', field: 'falseValue' },
  ],
  mapping: [
    { label: 'Map From', field: 'mapFrom' },
    { label: 'Map To', field: 'mapTo' },
  ],
  aggregation: [
    { label: 'Aggregation Type', field: 'aggregationType' },
    { label: 'Group By', field: 'groupBy' },
  ],
  filtering: [
    { label: 'Filter Expression', field: 'filterExpression' },
  ],
};

// Add grid background CSS to the block chain area
const gridBackground = {
  backgroundImage: `radial-gradient(circle, #e0e0e0 1px, transparent 1px)`,
  backgroundSize: '20px 20px',
};