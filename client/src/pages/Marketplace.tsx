import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  TextField,
  Select,
  MenuItem,
  Rating,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  Tooltip,
  CircularProgress,
  InputLabel,
  FormControl,
  Slider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Collapse,
  Paper,
  Divider,
  Grid,
} from '@mui/material';
import {
  Store as StoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  LocationOn as LocationIcon,
  Bookmark as BookmarkIcon,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import { formatDistanceToNow } from 'date-fns';

interface VendorMatchingCriteria {
  wasteTypes: string[];
  location: string;
  budget: [number, number];
  minRating: number;
  certifications: string[];
  searchQuery?: string;
}

interface Vendor {
  id: number;
  name: string;
  services: string[];
  rating: number;
  serviceAreas: string[];
  certificationsAndCompliance: string[];
  onTimeRate: number;
  recyclingEfficiency: number;
  customerSatisfaction: number;
  connectionStatus: 'online' | 'offline' | 'maintenance';
  lastConnected: string | null;
  companyLogo?: string;
}

export default function Marketplace() {
  const queryClient = useQueryClient();
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [matchingCriteria, setMatchingCriteria] = useState<VendorMatchingCriteria>({
    wasteTypes: [],
    location: '',
    budget: [0, 1000],
    minRating: 4,
    certifications: [],
    searchQuery: ''
  });
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const { data: vendors = [], isLoading, error } = useQuery<Vendor[]>({
    queryKey: ['/api/vendors', matchingCriteria],
    queryFn: async () => {
      try {
        const baseResponse = await fetch('/api/vendors');
        if (!baseResponse.ok) {
          throw new Error('Failed to fetch vendors');
        }
        const allVendors = await baseResponse.json();

        // Client-side filtering
        return allVendors.filter((vendor: Vendor) => {
          // Filter by waste types
          if (matchingCriteria.wasteTypes.length > 0) {
            const vendorServices = vendor.services.map(s => s.toLowerCase());
            const searchTypes = matchingCriteria.wasteTypes.map(t => t.toLowerCase());
            if (!searchTypes.some(type => vendorServices.includes(type))) {
              return false;
            }
          }

          // Filter by location
          if (matchingCriteria.location && !vendor.serviceAreas.includes(matchingCriteria.location)) {
            return false;
          }

          // Filter by rating
          if (vendor.rating < matchingCriteria.minRating) {
            return false;
          }

          // Filter by certifications
          if (matchingCriteria.certifications.length > 0) {
            const vendorCerts = vendor.certificationsAndCompliance.map(c => c.toLowerCase());
            const searchCerts = matchingCriteria.certifications.map(c => c.toLowerCase());
            if (!searchCerts.every(cert => vendorCerts.includes(cert))) {
              return false;
            }
          }

          // Filter by search query
          if (matchingCriteria.searchQuery) {
            const searchLower = matchingCriteria.searchQuery.toLowerCase();
            return vendor.name.toLowerCase().includes(searchLower) ||
                   vendor.services.some(s => s.toLowerCase().includes(searchLower));
          }

          return true;
        });
      } catch (error) {
        console.error('Error fetching or filtering vendors:', error);
        throw error;
      }
    }
  });

  const addToActiveVendorsMutation = useMutation({
    mutationFn: async (vendor: Vendor) => {
      const response = await fetch('/api/organization-vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          status: 'active',
          contractStartDate: new Date().toISOString(),
          contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to add vendor to active suppliers');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organization-vendors'] });
    },
  });

  const calculateMatchScore = (vendor: Vendor) => {
    let score = 0;

    const matchedTypes = vendor.services.filter(service =>
      matchingCriteria.wasteTypes.includes(service)
    ).length;
    score += matchingCriteria.wasteTypes.length > 0
      ? (matchedTypes / matchingCriteria.wasteTypes.length) * 40
      : 40;

    if (vendor.rating >= matchingCriteria.minRating) {
      score += 20;
    }

    if (matchingCriteria.certifications.length > 0) {
      const matchedCerts = vendor.certificationsAndCompliance.filter(cert =>
        matchingCriteria.certifications.includes(cert)
      ).length;
      score += (matchedCerts / matchingCriteria.certifications.length) * 20;
    } else {
      score += 20;
    }

    if (matchingCriteria.location === '' || vendor.serviceAreas.includes(matchingCriteria.location)) {
      score += 20;
    }

    return Math.round(score);
  };

  const handleExpand = (vendorId: number) => {
    setExpandedItem(expandedItem === vendorId ? null : vendorId);
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Vendor Marketplace"
        subtitle="Find and connect with waste management service providers"
      />

      <Paper sx={{ mb: 3, p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsFilterDialogOpen(true)}
          >
            Set Matching Criteria
          </Button>
          <TextField
            placeholder="Search vendors by name"
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
            value={matchingCriteria.searchQuery}
            onChange={(e) => setMatchingCriteria(prev => ({ ...prev, searchQuery: e.target.value }))}
            sx={{ width: 300 }}
          />
          {(matchingCriteria.wasteTypes.length > 0 || matchingCriteria.searchQuery) && (
            <Alert
              severity="info"
              action={
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={() => setMatchingCriteria({
                    wasteTypes: [],
                    location: '',
                    budget: [0, 1000],
                    minRating: 4,
                    certifications: [],
                    searchQuery: ''
                  })}
                >
                  <CancelIcon fontSize="inherit" />
                </IconButton>
              }
            >
              <Stack spacing={1}>
                {matchingCriteria.searchQuery && (
                  <Typography variant="body2">
                    Search: {matchingCriteria.searchQuery}
                  </Typography>
                )}
                {matchingCriteria.wasteTypes.length > 0 && (
                  <Typography variant="body2">
                    Waste Types: {matchingCriteria.wasteTypes.join(', ')}
                  </Typography>
                )}
                {matchingCriteria.location && (
                  <Typography variant="body2">
                    Location: {matchingCriteria.location}
                  </Typography>
                )}
                {matchingCriteria.minRating > 0 && (
                  <Typography variant="body2">
                    Min Rating: {matchingCriteria.minRating}
                  </Typography>
                )}
                {matchingCriteria.certifications.length > 0 && (
                  <Typography variant="body2">
                    Certifications: {matchingCriteria.certifications.join(', ')}
                  </Typography>
                )}
              </Stack>
            </Alert>
          )}
        </Stack>
      </Paper>

      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {vendors.map((vendor) => {
          const matchScore = calculateMatchScore(vendor);
          const isAvailable = vendor.connectionStatus === 'online';
          const isExpanded = expandedItem === vendor.id;

          return (
            <Paper key={vendor.id} sx={{ mb: 2 }}>
              <ListItem
                alignItems="flex-start"
                onClick={() => handleExpand(vendor.id)}
                sx={{ cursor: 'pointer' }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={vendor.companyLogo ? `/uploads/vendor-logos/${vendor.companyLogo}` : undefined}
                    sx={{ width: 56, height: 56 }}
                  >
                    {!vendor.companyLogo && <StoreIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="h6" component="div">
                      {vendor.name}
                    </Typography>
                  }
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Rating value={vendor.rating} readOnly size="small" />
                      {matchScore > 0 && (
                        <Chip
                          label={`${matchScore}% Match`}
                          color="success"
                          size="small"
                        />
                      )}
                      <Chip
                        icon={isAvailable ? <CheckCircleIcon /> : <CancelIcon />}
                        label={`Integration ${isAvailable ? 'Available' : 'Not Available'}`}
                        color={isAvailable ? 'success' : 'default'}
                        size="small"
                      />
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleExpand(vendor.id)}>
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Services:
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {vendor.services.map((service) => (
                              <Chip
                                key={service}
                                label={service}
                                color="primary"
                                size="small"
                                sx={{ mb: 1 }}
                              />
                            ))}
                          </Stack>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Certifications:
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {vendor.certificationsAndCompliance.map((cert) => (
                              <Chip
                                key={cert}
                                label={cert}
                                color="secondary"
                                size="small"
                                sx={{ mb: 1 }}
                                icon={<CheckCircleIcon />}
                              />
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Performance Metrics:
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <CircularProgress
                              variant="determinate"
                              value={vendor.onTimeRate}
                              size={40}
                            />
                            <Typography variant="caption" display="block">
                              On-Time Rate
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <CircularProgress
                              variant="determinate"
                              value={vendor.recyclingEfficiency}
                              size={40}
                              color="success"
                            />
                            <Typography variant="caption" display="block">
                              Recycling
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <CircularProgress
                              variant="determinate"
                              value={vendor.customerSatisfaction * 20}
                              size={40}
                              color="secondary"
                            />
                            <Typography variant="caption" display="block">
                              Satisfaction
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => addToActiveVendorsMutation.mutate(vendor)}
                      disabled={addToActiveVendorsMutation.isPending}
                    >
                      Make Active
                    </Button>
                    <Button variant="outlined">
                      Contact Vendor
                    </Button>
                  </Box>
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </List>

      <Dialog
        open={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Set Vendor Matching Criteria</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Waste Types</InputLabel>
              <Select
                multiple
                value={matchingCriteria.wasteTypes}
                onChange={(e) => setMatchingCriteria(prev => ({
                  ...prev,
                  wasteTypes: Array.isArray(e.target.value) ? e.target.value : [e.target.value]
                }))}
                label="Waste Types"
                renderValue={(selected) => selected.join(', ')}
              >
                <MenuItem value="General Waste">General Waste</MenuItem>
                <MenuItem value="Recyclables">Recyclables</MenuItem>
                <MenuItem value="Organic Waste">Organic Waste</MenuItem>
                <MenuItem value="Hazardous Waste">Hazardous Waste</MenuItem>
                <MenuItem value="Chemical Waste">Chemical Waste</MenuItem>
                <MenuItem value="Medical Waste">Medical Waste</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={matchingCriteria.location}
                onChange={(e) => setMatchingCriteria(prev => ({ ...prev, location: e.target.value }))}
                label="Location"
              >
                <MenuItem value="Sydney">Sydney</MenuItem>
                <MenuItem value="Melbourne">Melbourne</MenuItem>
                <MenuItem value="Brisbane">Brisbane</MenuItem>
                <MenuItem value="Perth">Perth</MenuItem>
                <MenuItem value="Adelaide">Adelaide</MenuItem>
                <MenuItem value="Darwin">Darwin</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography gutterBottom>Budget Range</Typography>
              <Slider
                value={matchingCriteria.budget}
                onChange={(_, value) => setMatchingCriteria(prev => ({
                  ...prev,
                  budget: value as [number, number]
                }))}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                marks={[
                  { value: 0, label: '$0' },
                  { value: 1000, label: '$1000' }
                ]}
              />
            </Box>

            <Box>
              <Typography gutterBottom>Minimum Rating</Typography>
              <Rating
                value={matchingCriteria.minRating}
                onChange={(_, value) => setMatchingCriteria(prev => ({
                  ...prev,
                  minRating: value || 0
                }))}
                precision={0.5}
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>Required Certifications</InputLabel>
              <Select
                multiple
                value={matchingCriteria.certifications}
                onChange={(e) => setMatchingCriteria(prev => ({
                  ...prev,
                  certifications: Array.isArray(e.target.value) ? e.target.value : [e.target.value]
                }))}
                label="Required Certifications"
                renderValue={(selected) => selected.join(', ')}
              >
                <MenuItem value="ISO 14001">ISO 14001</MenuItem>
                <MenuItem value="EPA Certified">EPA Certified</MenuItem>
                <MenuItem value="OHSAS 18001">OHSAS 18001</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFilterDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => setIsFilterDialogOpen(false)} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}