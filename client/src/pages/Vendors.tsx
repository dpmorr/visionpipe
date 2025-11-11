import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
} from "@mui/material";
import {
  Business as BusinessIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Building2, BarChart3, Activity, Plus, Edit2, Trash2 } from "lucide-react";


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
}

interface OrganizationVendor {
  id: number;
  vendorId: number;
  status: string;
  contractStartDate: string;
  contractEndDate: string;
  vendor: Vendor;
}

const customVendorSchema = z.object({
  vendorId: z.number({ required_error: "Please select a vendor" }),
});

const createVendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  services: z.array(z.string()).min(1, "At least one service is required"),
  serviceAreas: z.array(z.string()).min(1, "At least one service area is required"),
});

const editVendorSchema = z.object({
  status: z.string(),
  services: z.array(z.string()).min(1, "At least one service is required"),
  serviceAreas: z.array(z.string()).min(1, "At least one service area is required"),
  contractStartDate: z.string(),
  contractEndDate: z.string(),
});

export default function Vendors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVendorForEdit, setSelectedVendorForEdit] = useState<OrganizationVendor | null>(null);

  const addForm = useForm<z.infer<typeof customVendorSchema>>({
    resolver: zodResolver(customVendorSchema),
  });

  const createForm = useForm<z.infer<typeof createVendorSchema>>({
    resolver: zodResolver(createVendorSchema),
    defaultValues: {
      name: "",
      services: [],
      serviceAreas: [],
    },
  });

  const editForm = useForm<z.infer<typeof editVendorSchema>>({
    resolver: zodResolver(editVendorSchema),
    defaultValues: {
      status: 'active',
      services: [],
      serviceAreas: [],
      contractStartDate: '',
      contractEndDate: '',
    },
  });

  const { data: availableVendors = [] } = useQuery<Vendor[]>({
    queryKey: ['/api/vendors'],
  });

  const { data: organizationVendors = [] } = useQuery<OrganizationVendor[]>({
    queryKey: ['/api/organization-vendors'],
  });

  const removeVendorMutation = useMutation({
    mutationFn: async (vendorId: number) => {
      const response = await fetch(`/api/organization-vendors/${vendorId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove vendor');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organization-vendors'] });
      toast({
        title: "Vendor removed",
        description: "The vendor has been removed from your active vendors.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addVendorMutation = useMutation({
    mutationFn: async (values: z.infer<typeof customVendorSchema>) => {
      console.log('Adding vendor with ID:', values.vendorId);

      const response = await fetch('/api/organization-vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: values.vendorId,
          status: 'active'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to add vendor to organization');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organization-vendors'] });
      toast({
        title: "Success",
        description: "Vendor has been added to your active vendors.",
      });
      setIsAddModalOpen(false);
      addForm.reset();
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: async (values: z.infer<typeof createVendorSchema>) => {
      console.log('Form values:', values);

      const vendorData = {
        name: values.name,
        services: values.services,
        serviceAreas: values.serviceAreas,
        rating: 0,
        certificationsAndCompliance: [],
        onTimeRate: 0,
        recyclingEfficiency: 0,
        customerSatisfaction: 0,
        connectionStatus: 'online',
        status: 'active'
      };

      console.log('Vendor data to be sent:', vendorData);

      const vendorResponse = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vendorData),
      });

      if (!vendorResponse.ok) {
        const errorText = await vendorResponse.text();
        console.error('Vendor creation error:', errorText);
        throw new Error('Failed to create vendor');
      }

      const vendor = await vendorResponse.json();
      console.log('Created vendor:', vendor);

      const orgVendorResponse = await fetch('/api/organization-vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          status: 'active'
        }),
      });

      if (!orgVendorResponse.ok) {
        const errorText = await orgVendorResponse.text();
        console.error('Organization vendor error:', errorText);
        throw new Error('Failed to add vendor to organization');
      }

      return orgVendorResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organization-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      toast({
        title: "Success",
        description: "Custom vendor has been created and added to your active vendors.",
      });
      setIsCreateModalOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create custom vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const editVendorMutation = useMutation({
    mutationFn: async (values: { orgVendorId: number, data: any }) => {
      const response = await fetch(`/api/organization-vendors/${values.orgVendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values.data),
      });

      if (!response.ok) {
        throw new Error('Failed to update vendor');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organization-vendors'] });
      toast({
        title: "Success",
        description: "Vendor details updated successfully.",
      });
      setIsEditModalOpen(false);
      setSelectedVendorForEdit(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onAddSubmit = (values: z.infer<typeof customVendorSchema>) => {
    addVendorMutation.mutate(values);
  };

  const onCreateSubmit = (values: z.infer<typeof createVendorSchema>) => {
    createVendorMutation.mutate(values);
  };

  const handleEdit = (orgVendor: OrganizationVendor) => {
    setSelectedVendorForEdit(orgVendor);
    editForm.reset({
      status: orgVendor.status,
      services: orgVendor.vendor.services,
      serviceAreas: orgVendor.vendor.serviceAreas,
      contractStartDate: orgVendor.contractStartDate,
      contractEndDate: orgVendor.contractEndDate,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: z.infer<typeof editVendorSchema>) => {
    if (selectedVendorForEdit) {
      editVendorMutation.mutate({
        orgVendorId: selectedVendorForEdit.id,
        data: {
          status: data.status,
          services: data.services,
          serviceAreas: data.serviceAreas,
          contractStartDate: data.contractStartDate,
          contractEndDate: data.contractEndDate,
        },
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Active Vendors
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your organization's active vendors and vendor relationships
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Vendor
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {organizationVendors.map((orgVendor) => (
          <Grid item xs={12} sm={6} md={4} key={orgVendor.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{orgVendor.vendor.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: <Chip 
                        label={orgVendor.status.charAt(0).toUpperCase() + orgVendor.status.slice(1)}
                        color={orgVendor.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </Typography>
                  </Box>
                  <IconButton
                    color="error"
                    onClick={() => removeVendorMutation.mutate(orgVendor.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      Services: {orgVendor.vendor.services.join(", ")}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      On-time Rate: {orgVendor.vendor.onTimeRate}%
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Contract Period:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(orgVendor.contractStartDate).toLocaleDateString()} - {new Date(orgVendor.contractEndDate).toLocaleDateString()}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(orgVendor)}
                  sx={{ mt: 2 }}
                >
                  Edit Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Vendor</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Add a vendor from the marketplace to your active vendors list.
          </DialogContentText>
          <form onSubmit={addForm.handleSubmit(onAddSubmit)}>
            <FormControl fullWidth>
              <InputLabel>Select Vendor</InputLabel>
              <Select
                label="Select Vendor"
                onChange={(e) => addForm.setValue("vendorId", Number(e.target.value))}
                error={!!addForm.formState.errors.vendorId}
              >
                {availableVendors.map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.id}>
                    {vendor.name} - {vendor.services.join(", ")}
                  </MenuItem>
                ))}
              </Select>
              {addForm.formState.errors.vendorId && (
                <Typography variant="body2" color="error">
                  {addForm.formState.errors.vendorId.message}
                </Typography>
              )}
            </FormControl>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddModalOpen(false)}>
            Cancel
          </Button>
          <LoadingButton
            loading={addVendorMutation.isPending}
            onClick={addForm.handleSubmit(onAddSubmit)}
            variant="contained"
          >
            Add Vendor
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Custom Vendor</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Create a new custom vendor for your organization.
          </DialogContentText>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Vendor Name"
                  variant="outlined"
                  fullWidth
                  {...createForm.register("name")}
                  error={!!createForm.formState.errors.name}
                  helperText={createForm.formState.errors.name?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Services</InputLabel>
                  <Select
                    multiple
                    value={createForm.watch("services")}
                    onChange={(e) => createForm.setValue("services", e.target.value)}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    <MenuItem value="General Waste">General Waste</MenuItem>
                    <MenuItem value="Recyclables">Recyclables</MenuItem>
                    <MenuItem value="Hazardous Waste">Hazardous Waste</MenuItem>
                    <MenuItem value="Medical Waste">Medical Waste</MenuItem>
                    <MenuItem value="Organic Waste">Organic Waste</MenuItem>
                    <MenuItem value="Construction Waste">Construction Waste</MenuItem>
                    <MenuItem value="E-Waste">E-Waste</MenuItem>
                    <MenuItem value="Liquid Waste">Liquid Waste</MenuItem>
                  </Select>
                </FormControl>
                {createForm.formState.errors.services && (
                  <Typography variant="body2" color="error">
                    {createForm.formState.errors.services.message}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Service Areas</InputLabel>
                  <Select
                    multiple
                    value={createForm.watch("serviceAreas")}
                    onChange={(e) => createForm.setValue("serviceAreas", e.target.value)}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    <MenuItem value="Sydney">Sydney</MenuItem>
                    <MenuItem value="Melbourne">Melbourne</MenuItem>
                    <MenuItem value="Brisbane">Brisbane</MenuItem>
                    <MenuItem value="Perth">Perth</MenuItem>
                    <MenuItem value="Adelaide">Adelaide</MenuItem>
                    <MenuItem value="Darwin">Darwin</MenuItem>
                  </Select>
                </FormControl>
                {createForm.formState.errors.serviceAreas && (
                  <Typography variant="body2" color="error">
                    {createForm.formState.errors.serviceAreas.message}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateModalOpen(false)}>
            Cancel
          </Button>
          <LoadingButton
            loading={createVendorMutation.isPending}
            onClick={createForm.handleSubmit(onCreateSubmit)}
            variant="contained"
          >
            Create Vendor
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVendorForEdit(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Vendor Details</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the vendor's information and settings.
          </DialogContentText>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editForm.watch("status")}
                    onChange={(e) => editForm.setValue("status", e.target.value)}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Services</InputLabel>
                  <Select
                    multiple
                    value={editForm.watch("services")}
                    onChange={(e) => editForm.setValue("services", e.target.value)}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    <MenuItem value="General Waste">General Waste</MenuItem>
                    <MenuItem value="Recyclables">Recyclables</MenuItem>
                    <MenuItem value="Hazardous Waste">Hazardous Waste</MenuItem>
                    <MenuItem value="Medical Waste">Medical Waste</MenuItem>
                    <MenuItem value="Organic Waste">Organic Waste</MenuItem>
                    <MenuItem value="Construction Waste">Construction Waste</MenuItem>
                    <MenuItem value="E-Waste">E-Waste</MenuItem>
                    <MenuItem value="Liquid Waste">Liquid Waste</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Service Areas</InputLabel>
                  <Select
                    multiple
                    value={editForm.watch("serviceAreas")}
                    onChange={(e) => editForm.setValue("serviceAreas", e.target.value)}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    <MenuItem value="Sydney">Sydney</MenuItem>
                    <MenuItem value="Melbourne">Melbourne</MenuItem>
                    <MenuItem value="Brisbane">Brisbane</MenuItem>
                    <MenuItem value="Perth">Perth</MenuItem>
                    <MenuItem value="Adelaide">Adelaide</MenuItem>
                    <MenuItem value="Darwin">Darwin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Contract Start Date"
                  type="date"
                  variant="outlined"
                  fullWidth
                  {...editForm.register("contractStartDate")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Contract End Date"
                  type="date"
                  variant="outlined"
                  fullWidth
                  {...editForm.register("contractEndDate")}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsEditModalOpen(false);
            setSelectedVendorForEdit(null);
          }}>
            Cancel
          </Button>
          <LoadingButton
            loading={editVendorMutation.isPending}
            type="submit"
            onClick={editForm.handleSubmit(handleEditSubmit)}
            variant="contained"
          >
            Save Changes
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 