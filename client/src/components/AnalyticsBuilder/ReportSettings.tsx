import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, TextField, Slider } from '@mui/material';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { VendorLogoUpload } from '../VendorLogoUpload';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save as SaveIcon } from '@mui/icons-material';

export function ReportSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    headerAlignment: 'left',
    includeTimestamp: true,
    includePagination: true,
    watermarkOpacity: 0.1,
    includeWatermark: true,
    footerText: '',
    defaultColorScheme: 'default',
    companyName: '',
    companyAddress: '',
    companyContact: '',
    companyWebsite: '',
    headerStyle: 'standard',
    companyLogo: '',
  });

  const { data: reportSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/organization/report-settings'],
    queryFn: async () => {
      console.log('Fetching report settings...');
      const response = await fetch('/api/organization/report-settings');
      if (!response.ok) throw new Error('Failed to fetch report settings');
      const data = await response.json();
      console.log('Fetched report settings:', data);
      return data || {};
    }
  });

  // Initialize settings from fetched data
  useEffect(() => {
    if (reportSettings) {
      console.log('Updating settings state with:', reportSettings);
      setSettings(prev => ({
        ...prev,
        ...reportSettings
      }));
    }
  }, [reportSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      console.log('Saving settings:', newSettings);
      const response = await fetch('/api/organization/report-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (!response.ok) throw new Error('Failed to update report settings');
      const data = await response.json();
      console.log('Settings saved successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Settings mutation successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['/api/organization/report-settings'] });
      // Update local state to match server state
      setSettings(data);
      toast({
        title: 'Settings updated',
        description: 'Report settings have been saved successfully.'
      });
    },
    onError: (error) => {
      console.error('Settings mutation failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update report settings',
        variant: 'destructive'
      });
    }
  });

  const handleLogoUpload = async (file: File) => {
    console.log('Handling logo upload:', file);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await fetch('/api/organization/logo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload logo');

      const data = await response.json();
      console.log('Logo upload successful:', data);

      // Force refetch settings to get updated logo
      await queryClient.invalidateQueries({ queryKey: ['/api/organization/report-settings'] });

      toast({
        title: 'Success',
        description: 'Company logo uploaded successfully'
      });
    } catch (error) {
      console.error('Logo upload failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'destructive'
      });
    }
  };

  const handleSettingChange = (setting: string, value: any) => {
    console.log('Updating setting:', setting, 'with value:', value);
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = () => {
    console.log('Saving all settings:', settings);
    updateSettingsMutation.mutate(settings);
  };

  if (isLoadingSettings) {
    return <Typography>Loading settings...</Typography>;
  }

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>Report Settings</Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Company Information</Typography>
          <VendorLogoUpload 
            onUploadSuccess={handleLogoUpload}
            currentLogo={settings.companyLogo}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
            Recommended size: 200x200px, PNG or JPG format
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Company Name"
              value={settings.companyName}
              onChange={(e) => handleSettingChange('companyName', e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Company Address"
              value={settings.companyAddress}
              onChange={(e) => handleSettingChange('companyAddress', e.target.value)}
            />
            <TextField
              fullWidth
              label="Contact Information"
              value={settings.companyContact}
              onChange={(e) => handleSettingChange('companyContact', e.target.value)}
            />
            <TextField
              fullWidth
              label="Website"
              value={settings.companyWebsite}
              onChange={(e) => handleSettingChange('companyWebsite', e.target.value)}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Layout Options</Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Header Style</InputLabel>
            <Select
              value={settings.headerStyle}
              label="Header Style"
              onChange={(e) => handleSettingChange('headerStyle', e.target.value)}
            >
              <MenuItem value="standard">Standard</MenuItem>
              <MenuItem value="modern">Modern</MenuItem>
              <MenuItem value="minimal">Minimal</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Header Alignment</InputLabel>
            <Select
              value={settings.headerAlignment}
              label="Header Alignment"
              onChange={(e) => handleSettingChange('headerAlignment', e.target.value)}
            >
              <MenuItem value="left">Left</MenuItem>
              <MenuItem value="center">Center</MenuItem>
              <MenuItem value="right">Right</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={settings.includeTimestamp}
                onChange={(e) => handleSettingChange('includeTimestamp', e.target.checked)}
              />
            }
            label="Include Generation Timestamp"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.includePagination}
                onChange={(e) => handleSettingChange('includePagination', e.target.checked)}
              />
            }
            label="Include Page Numbers"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.includeWatermark}
                onChange={(e) => handleSettingChange('includeWatermark', e.target.checked)}
              />
            }
            label="Include Compliro Watermark"
          />

          {settings.includeWatermark && (
            <Box sx={{ px: 2, mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Watermark Opacity
              </Typography>
              <Slider
                value={settings.watermarkOpacity}
                onChange={(_, value) => handleSettingChange('watermarkOpacity', value)}
                min={0.05}
                max={0.2}
                step={0.01}
                marks
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              />
            </Box>
          )}

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Color Scheme</InputLabel>
            <Select
              value={settings.defaultColorScheme}
              label="Color Scheme"
              onChange={(e) => handleSettingChange('defaultColorScheme', e.target.value)}
            >
              <MenuItem value="default">Default</MenuItem>
              <MenuItem value="professional">Professional</MenuItem>
              <MenuItem value="modern">Modern</MenuItem>
              <MenuItem value="classic">Classic</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Custom Footer Text"
            value={settings.footerText}
            onChange={(e) => handleSettingChange('footerText', e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Enter custom footer text for your reports"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
          startIcon={<SaveIcon />}
        >
          {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Paper>
  );
}