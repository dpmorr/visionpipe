import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  alpha,
  useTheme,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  ListItemButton,
  InputAdornment,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Link as LinkIcon,
  Science as ScienceIcon,
  LocalShipping as LocalShippingIcon,
  AttachMoney as AttachMoneyIcon,
  CloudDownload as CloudDownloadIcon,
  Dataset as DatasetIcon,
  Timeline as TimelineIcon,
  Cloud as CloudIcon,
  TableChart as TableChartIcon,
  Public as PublicIcon,
  CloudQueue as CloudQueueIcon,
  CameraAlt as CameraAltIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

type ModelType = 'waste' | 'environmental' | 'material' | 'lca' | 'carbon' | 'cost' | 'cv';
type ModelSource = 'internal' | 'ecoinvent' | 'external';
type ModelStatus = 'in progress' | 'inactive' | 'archived';

interface DataModel {
  id: string;
  name: string;
  description: string;
  type: ModelType;
  source: ModelSource;
  lastUpdated: string;
  version: string;
  status: ModelStatus;
  builderConfig?: any;
}

// Example models for each category
const exampleModels: Record<ModelType, DataModel[]> = {
  waste: [
    {
      id: '1',
      name: 'General Waste Stream',
      description: 'Standard model for general waste tracking and categorization',
      type: 'waste',
      source: 'internal',
      lastUpdated: '2024-03-15',
      version: '1.2',
      status: 'in progress'
    },
    {
      id: 'w2',
      name: 'Hazardous Waste Model',
      description: 'Specialized model for hazardous waste classification and handling',
      type: 'waste',
      source: 'internal',
      lastUpdated: '2024-03-14',
      version: '2.0',
      status: 'inactive'
    }
  ],
  environmental: [
    {
      id: 'e1',
      name: 'Ecoinvent Waste Model',
      description: 'Environmental impact data from Ecoinvent database',
      type: 'environmental',
      source: 'ecoinvent',
      lastUpdated: '2024-03-10',
      version: '3.8',
      status: 'in progress'
    },
    {
      id: 'e2',
      name: 'Local Environmental Factors',
      description: 'Region-specific environmental impact factors',
      type: 'environmental',
      source: 'external',
      lastUpdated: '2024-03-12',
      version: '1.5',
      status: 'inactive'
    }
  ],
  material: [
    {
      id: 'm1',
      name: 'Material Flow Analysis',
      description: 'Comprehensive material flow tracking model',
      type: 'material',
      source: 'internal',
      lastUpdated: '2024-03-12',
      version: '2.1',
      status: 'in progress'
    }
  ],
  lca: [
    {
      id: 'l1',
      name: 'Waste LCA Model',
      description: 'Life cycle assessment model for waste management',
      type: 'lca',
      source: 'ecoinvent',
      lastUpdated: '2024-03-11',
      version: '1.0',
      status: 'inactive'
    }
  ],
  carbon: [
    {
      id: 'c1',
      name: 'GHG Emissions Model',
      description: 'Greenhouse gas emissions tracking model',
      type: 'carbon',
      source: 'internal',
      lastUpdated: '2024-03-13',
      version: '1.3',
      status: 'in progress'
    }
  ],
  cost: [
    {
      id: 'co1',
      name: 'Waste Management Cost Model',
      description: 'Comprehensive cost analysis for waste management',
      type: 'cost',
      source: 'internal',
      lastUpdated: '2024-03-14',
      version: '1.1',
      status: 'inactive'
    }
  ],
  cv: [] // Placeholder for Computer Vision models
};

// Move tabModelSets outside the component
const tabModelSets = [
  // Default
  [
    ...exampleModels.waste,
    ...exampleModels.environmental,
    ...exampleModels.material,
    ...exampleModels.lca,
    ...exampleModels.carbon,
    ...exampleModels.cost,
  ],
  // My Models (for demo, just use waste and material)
  [
    ...exampleModels.waste,
    ...exampleModels.material,
  ],
];

export default function DataModels() {
  const [currentTab, setCurrentTab] = useState(0);
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<React.ReactNode>(<TableChartIcon />);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [databaseModalOpen, setDatabaseModalOpen] = useState(false);
  const [hostedModalOpen, setHostedModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [databaseConfig, setDatabaseConfig] = useState({
    type: '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
  });
  const [hostedConfig, setHostedConfig] = useState({
    name: '',
    description: '',
    type: '',
  });
  const { toast } = useToast();
  const theme = useTheme();
  const [, navigate] = useLocation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editModel, setEditModel] = useState<DataModel | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<ModelStatus>('in progress');
  const [models, setModels] = useState(() => tabModelSets.map(set => [...set])); // local state for models

  const handleNewModelClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleImportModel = () => {
    handleMenuClose();
    setImportModalOpen(true);
  };

  const handleDatabaseModel = () => {
    handleMenuClose();
    setDatabaseModalOpen(true);
  };

  const handleHostedModel = () => {
    handleMenuClose();
    setHostedModalOpen(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleImportSubmit = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }
    // Handle file upload logic here
    toast({
      title: "Success",
      description: "Model imported successfully",
    });
    setImportModalOpen(false);
    setSelectedFile(null);
  };

  const handleDatabaseSubmit = () => {
    // Validate database configuration
    if (!databaseConfig.type || !databaseConfig.host || !databaseConfig.database) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    // Handle database connection logic here
    toast({
      title: "Success",
      description: "Database connection established",
    });
    setDatabaseModalOpen(false);
    setDatabaseConfig({
      type: '',
      host: '',
      port: '',
      database: '',
      username: '',
      password: '',
    });
  };

  const handleHostedSubmit = () => {
    if (!hostedConfig.name || !hostedConfig.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    // Handle hosted model creation logic here
    toast({
      title: "Success",
      description: "Hosted model created successfully",
    });
    setHostedModalOpen(false);
    setHostedConfig({
      name: '',
      description: '',
      type: '',
    });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const key = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
    // This logic is no longer needed as categories are removed
    // setCustomCategories([...customCategories, { key, label: newCategoryName, icon: newCategoryIcon }]);
    setNewCategoryName('');
    setNewCategoryIcon(<TableChartIcon />);
    setAddDialogOpen(false);
    // setCurrentCategory(key); // This line is no longer needed
  };

  const handleDeleteCategory = (key: string) => {
    // This logic is no longer needed as categories are removed
    // setCustomCategories(customCategories.filter(cat => cat.key !== key));
    // if (currentCategory === key) setCurrentCategory('waste'); // This line is no longer needed
  };

  // Update filteredModels to use local state
  const filteredModels = models[currentTab].filter(model =>
    model.name.toLowerCase().includes(search.toLowerCase())
  );

  // Edit modal handlers
  const handleOpenEdit = (model: DataModel) => {
    setEditModel(model);
    setEditDescription(model.description);
    setEditStatus(model.status);
  };
  const handleCloseEdit = () => {
    setEditModel(null);
    setEditDescription('');
    setEditStatus('in progress');
  };
  const handleSaveEdit = () => {
    if (!editModel) return;
    setModels(prev => prev.map((set, i) =>
      i === currentTab
        ? set.map(m => m.id === editModel.id ? { ...m, description: editDescription, status: editStatus } : m)
        : set
    ));
    handleCloseEdit();
  };

  const renderModelCard = (model: DataModel) => (
    <Card 
      key={model.id}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" gutterBottom>
                {model.name}
              </Typography>
              <Chip
                label={
                  model.status === 'in progress' ? 'In Progress' :
                  model.status === 'inactive' ? 'Inactive' :
                  model.status === 'archived' ? 'Archived' : model.status
                }
                size="small"
                color={
                  model.status === 'in progress' ? 'success' :
                  model.status === 'inactive' ? 'warning' :
                  model.status === 'archived' ? 'default' : 'default'
                }
                sx={{ ml: 1 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {model.description}
            </Typography>
          </Box>
          <Box>
            <Chip 
              label={model.source} 
              size="small"
              sx={{ 
                bgcolor: model.source === 'internal' 
                  ? alpha(theme.palette.primary.main, 0.1)
                  : model.source === 'ecoinvent'
                  ? alpha(theme.palette.success.main, 0.1)
                  : alpha(theme.palette.info.main, 0.1),
                color: model.source === 'internal'
                  ? theme.palette.primary.main
                  : model.source === 'ecoinvent'
                  ? theme.palette.success.main
                  : theme.palette.info.main,
              }}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Version {model.version} • Updated {model.lastUpdated}
          </Typography>
          <Box>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleOpenEdit(model)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(`/data-builder/${model.id}`)}
          >
            Edit in Builder
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Data Models
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleImportModel}
          >
            Import Model
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/data-builder')}
          >
            Go to Data Builder
          </Button>
        </Box>
      </Box>

      {/* Centered main content with equal left/right margin */}
      <Box sx={{ maxWidth: 1500, mx: 'auto', pl: 2, pr: 2 }}>
        <Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          sx={{ minHeight: 48, mb: 2 }}
        >
          <Tab label="Default" sx={{ minWidth: 120 }} />
          <Tab label="My Models" sx={{ minWidth: 120 }} />
        </Tabs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <TextField
            size="small"
            placeholder="Search models..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" sx={{ minWidth: 120 }} onClick={() => setFiltersOpen(true)}>
            Filters
          </Button>
        </Box>

        <Grid container spacing={4}>
          {filteredModels.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No models available in this category yet.
                </Typography>
              </Card>
            </Grid>
          ) : (
            filteredModels.map(model => (
              <Grid item xs={12} sm={6} md={4} key={model.id}>
                {renderModelCard(model)}
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* Import Model Modal */}
      <Dialog open={importModalOpen} onClose={() => setImportModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Model</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              accept=".json,.csv,.xlsx"
              style={{ display: 'none' }}
              id="model-file-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="model-file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Choose File
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" color="text.secondary">
                Selected file: {selectedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportModalOpen(false)}>Cancel</Button>
          <Button onClick={handleImportSubmit} variant="contained">Import</Button>
        </DialogActions>
      </Dialog>

      {/* Database Connection Modal */}
      <Dialog open={databaseModalOpen} onClose={() => setDatabaseModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connect to Database</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Database Type</InputLabel>
              <Select
                value={databaseConfig.type}
                label="Database Type"
                onChange={(e) => setDatabaseConfig({ ...databaseConfig, type: e.target.value })}
              >
                <SelectMenuItem value="postgresql">PostgreSQL</SelectMenuItem>
                <SelectMenuItem value="mysql">MySQL</SelectMenuItem>
                <SelectMenuItem value="sqlserver">SQL Server</SelectMenuItem>
                <SelectMenuItem value="oracle">Oracle</SelectMenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Host"
              value={databaseConfig.host}
              onChange={(e) => setDatabaseConfig({ ...databaseConfig, host: e.target.value })}
              fullWidth
            />
            <TextField
              label="Port"
              value={databaseConfig.port}
              onChange={(e) => setDatabaseConfig({ ...databaseConfig, port: e.target.value })}
              fullWidth
            />
            <TextField
              label="Database Name"
              value={databaseConfig.database}
              onChange={(e) => setDatabaseConfig({ ...databaseConfig, database: e.target.value })}
              fullWidth
            />
            <TextField
              label="Username"
              value={databaseConfig.username}
              onChange={(e) => setDatabaseConfig({ ...databaseConfig, username: e.target.value })}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={databaseConfig.password}
              onChange={(e) => setDatabaseConfig({ ...databaseConfig, password: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDatabaseModalOpen(false)}>Cancel</Button>
          <Button onClick={handleDatabaseSubmit} variant="contained">Connect</Button>
        </DialogActions>
      </Dialog>

      {/* Create Hosted Source Modal */}
      <Dialog open={hostedModalOpen} onClose={() => setHostedModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Hosted Source</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Model Name"
              value={hostedConfig.name}
              onChange={(e) => setHostedConfig({ ...hostedConfig, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={hostedConfig.description}
              onChange={(e) => setHostedConfig({ ...hostedConfig, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Model Type</InputLabel>
              <Select
                value={hostedConfig.type}
                label="Model Type"
                onChange={(e) => setHostedConfig({ ...hostedConfig, type: e.target.value })}
              >
                <SelectMenuItem value="waste">Waste Stream Model</SelectMenuItem>
                <SelectMenuItem value="environmental">Environmental Impact</SelectMenuItem>
                <SelectMenuItem value="material">Material Flow</SelectMenuItem>
                <SelectMenuItem value="lca">LCA Model</SelectMenuItem>
                <SelectMenuItem value="carbon">Carbon Footprint</SelectMenuItem>
                <SelectMenuItem value="cost">Cost Model</SelectMenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHostedModalOpen(false)}>Cancel</Button>
          <Button onClick={handleHostedSubmit} variant="contained">Create Spreadsheet</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Model Modal */}
      <Dialog open={!!editModel} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Model</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>{editModel?.name}</Typography>
          <TextField
            label="Description"
            value={editDescription}
            onChange={e => setEditDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={editStatus}
              label="Status"
              onChange={e => setEditStatus(e.target.value as ModelStatus)}
            >
              <SelectMenuItem value="in progress">In Progress</SelectMenuItem>
              <SelectMenuItem value="inactive">Inactive</SelectMenuItem>
              <SelectMenuItem value="archived">Archived</SelectMenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Filters Dialog */}
      <Dialog open={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <DialogTitle>Filter Models</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 300, py: 2 }}>
            Filter options coming soon...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFiltersOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 