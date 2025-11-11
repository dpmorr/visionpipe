import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  SelectChangeEvent,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tooltip,
  IconButton
} from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Vendor, Sensor, WastePoint, WastePointFormData } from '../types';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface AddWastePointModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WastePointFormData) => void;
  initialData?: WastePoint | null;
}

const wasteTypes = ['General', 'Recyclable', 'Hazardous', 'Organic'];
const units = ['kg', 'tons', 'liters'];
const intervals = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

const binInfo = {
  'General': [
    { size: 'Small Wheel Bin', capacity: '60L', description: 'Standard small wheelie bin' },
    { size: 'Large Wheel Bin', capacity: '120L', description: 'Standard large wheelie bin' },
    { size: 'Front Loader', capacity: '1100L', description: 'Large commercial bin' },
    { size: 'Skip Bin', capacity: '2-8m³', description: 'Large open-top container' }
  ],
  'Recyclable': [
    { size: 'Small Wheel Bin', capacity: '60L', description: 'Standard small recycling bin' },
    { size: 'Large Wheel Bin', capacity: '120L', description: 'Standard large recycling bin' },
    { size: 'Front Loader', capacity: '1100L', description: 'Large commercial recycling bin' }
  ],
  'Hazardous': [
    { size: 'Small Container', capacity: '20L', description: 'Small hazardous waste container' },
    { size: 'Medium Container', capacity: '60L', description: 'Medium hazardous waste container' },
    { size: 'Large Container', capacity: '120L', description: 'Large hazardous waste container' }
  ],
  'Organic': [
    { size: 'Small Wheel Bin', capacity: '60L', description: 'Standard small organic bin' },
    { size: 'Large Wheel Bin', capacity: '120L', description: 'Standard large organic bin' },
    { size: 'Front Loader', capacity: '1100L', description: 'Large commercial organic bin' }
  ]
};

export default function AddWastePointModal({ open, onClose, onSubmit, initialData }: AddWastePointModalProps) {
  const [formData, setFormData] = useState<WastePointFormData>({
    processStep: '',
    wasteType: '',
    estimatedVolume: 0,
    unit: '',
    vendor: '',
    notes: '',
    locationData: undefined,
    interval: 'weekly'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleMaps = () => {
      console.log('Checking Google Maps availability...');
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        console.log('Google Maps is loaded and available');
        setIsGoogleMapsLoaded(true);
        return true;
      }
      console.log('Google Maps not yet available');
      return false;
    };

    if (checkGoogleMaps()) {
      return;
    }

    // If not loaded, check every 100ms
    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Initialize services when Google Maps is loaded
  useEffect(() => {
    if (isGoogleMapsLoaded && !autocompleteService.current) {
      console.log('Initializing Google Maps services');
      autocompleteService.current = new google.maps.places.AutocompleteService();
      placesService.current = new google.maps.places.PlacesService(document.createElement('div'));
    }
  }, [isGoogleMapsLoaded]);

  const handleLocationSearch = (value: string) => {
    console.log('Handling location search:', value);
    setSearchQuery(value);

    if (!autocompleteService.current || !value) {
      setPredictions([]);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input: value,
        componentRestrictions: { country: 'au' },
        types: ['address']
      },
      (predictions, status) => {
        console.log('Got predictions:', predictions, 'Status:', status);
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions);
        } else {
          setPredictions([]);
        }
      }
    );
  };

  const handlePlaceSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    console.log('Handling place select:', prediction);
    if (!placesService.current) return;

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry', 'name', 'place_id']
      },
      (place, status) => {
        console.log('Got place details:', place, 'Status:', status);
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
          const locationData = {
            address: place.formatted_address || place.name || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id || ''
          };
          console.log('Setting location data:', locationData);
          setFormData(prev => ({
            ...prev,
            locationData
          }));
          setSearchQuery(place.formatted_address || place.name || '');
          setPredictions([]);
        }
      }
    );
  };

  // Update form data when initialData changes
  useEffect(() => {
    console.log('InitialData changed:', initialData);
    if (initialData) {
      setFormData({
        processStep: initialData.process_step,
        wasteType: initialData.wasteType,
        estimatedVolume: Number(initialData.estimatedVolume),
        unit: initialData.unit,
        vendor: initialData.vendor,
        notes: initialData.notes || '',
        locationData: initialData.locationData,
        interval: initialData.interval || 'weekly'
      });
      if (initialData.locationData) {
        console.log('Setting initial location:', initialData.locationData.address);
        setSearchQuery(initialData.locationData.address);
      }
    } else {
      setFormData({
        processStep: '',
        wasteType: '',
        estimatedVolume: 0,
        unit: '',
        vendor: '',
        notes: '',
        locationData: undefined,
        interval: 'weekly'
      });
      setSearchQuery('');
    }
  }, [initialData]);

  // Fetch active vendors list
  const { data: organizationVendors = [] } = useQuery<{ vendor: Vendor }[]>({
    queryKey: ['/api/organization-vendors'],
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedVolume' ? Number(value) : value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    if (!initialData) {
      setFormData({
        processStep: '',
        wasteType: '',
        estimatedVolume: 0,
        unit: '',
        vendor: '',
        notes: '',
        locationData: undefined,
        interval: 'weekly'
      });
      setSearchQuery('');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>{initialData ? 'Edit Waste Point' : 'Add New Waste Point'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="processStep"
                label="Name"
                fullWidth
                required
                value={formData.processStep}
                onChange={handleTextChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Waste Type</InputLabel>
                <Select
                  name="wasteType"
                  value={formData.wasteType}
                  onChange={handleSelectChange}
                  label="Waste Type"
                  endAdornment={
                    <Tooltip 
                      title={
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Available Bin Sizes:</Typography>
                          {formData.wasteType && binInfo[formData.wasteType as keyof typeof binInfo]?.map((bin, index) => (
                            <Typography key={index} variant="body2">
                              • {bin.size} ({bin.capacity}): {bin.description}
                            </Typography>
                          ))}
                        </Box>
                      }
                    >
                      <IconButton size="small">
                        <InfoOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  {wasteTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="estimatedVolume"
                label="Estimated Volume"
                type="number"
                fullWidth
                required
                value={formData.estimatedVolume}
                onChange={handleTextChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Unit</InputLabel>
                <Select
                  name="unit"
                  value={formData.unit}
                  onChange={handleSelectChange}
                  label="Unit"
                >
                  {units.map(unit => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Interval</InputLabel>
                <Select
                  name="interval"
                  value={formData.interval}
                  onChange={handleSelectChange}
                  label="Interval"
                  endAdornment={
                    <Tooltip 
                      title={
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Pickup Frequency:</Typography>
                          <Typography variant="body2">• Daily: Waste collected every day</Typography>
                          <Typography variant="body2">• Weekly: Waste collected once per week</Typography>
                          <Typography variant="body2">• Monthly: Waste collected once per month</Typography>
                          <Typography variant="body2">• Quarterly: Waste collected every 3 months</Typography>
                          <Typography variant="body2">• Yearly: Waste collected once per year</Typography>
                        </Box>
                      }
                    >
                      <IconButton size="small">
                        <InfoOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  {intervals.map(interval => (
                    <MenuItem key={interval} value={interval}>
                      {interval.charAt(0).toUpperCase() + interval.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Vendor</InputLabel>
                <Select
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleSelectChange}
                  label="Vendor"
                >
                  {organizationVendors.map(({ vendor }) => (
                    <MenuItem key={vendor.id} value={vendor.name}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ position: 'relative' }} ref={dropdownRef}>
                <Typography variant="subtitle2" gutterBottom>
                  Location
                </Typography>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  onFocus={() => {
                    console.log('Location input focused');
                    if (inputRef.current) {
                      console.log('Setting input value to:', searchQuery);
                      inputRef.current.value = searchQuery;
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: 'white'
                  }}
                />
                {predictions.length > 0 && (
                  <Paper
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 2,
                      mt: 1,
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}
                  >
                    <List>
                      {predictions.map((prediction) => (
                        <ListItem
                          key={prediction.place_id}
                          component="div"
                          onClick={() => handlePlaceSelect(prediction)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <ListItemText primary={prediction.description} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                multiline
                rows={3}
                fullWidth
                value={formData.notes}
                onChange={handleTextChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {initialData ? 'Save Changes' : 'Add Waste Point'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}