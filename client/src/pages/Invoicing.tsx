import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Checkbox
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  AttachMoney as MoneyIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: number;
  invoiceNumber: string;
  vendorId: number;
  vendorName: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  notes?: string;
  wastePointIds?: number[];
  wastePoints?: number[];
  attachments?: InvoiceAttachment[];
}

interface InvoiceAttachment {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
}

interface WastePoint {
  id: number;
  name: string;
  process_step: string;
  wasteType: string;
  estimatedVolume: number;
  unit: string;
}

interface Vendor {
  id: number;
  name: string;
  status: string;
}

interface OrganizationVendor {
  id: number;
  vendor: Vendor;
  status: string;
}

export default function Invoicing() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [formValues, setFormValues] = useState({
    vendorId: '',
    wastePointIds: [] as number[],
    issueDate: null as Date | null,
    dueDate: null as Date | null,
    totalAmount: '',
    notes: '',
    attachments: [] as File[]
  });
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const queryClient = useQueryClient();

  const { data: organizationVendors = [] } = useQuery<OrganizationVendor[]>({
    queryKey: ['/api/organization-vendors'],
  });

  const { data: wastePoints = [] } = useQuery<WastePoint[]>({
    queryKey: ['/api/waste-points'],
  });

  const createInvoice = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsModalVisible(false);
      setFormValues({
        vendorId: '',
        wastePointIds: [],
        issueDate: null,
        dueDate: null,
        totalAmount: '',
        notes: '',
        attachments: []
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: 'Success',
        description: 'Invoice created successfully'
      });
    }
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        body: formData
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update invoice');
      }
      return response.json();
    },
    onSuccess: (updatedInvoice) => {
      setIsModalVisible(false);
      setFormValues({
        vendorId: '',
        wastePointIds: [],
        issueDate: null,
        dueDate: null,
        totalAmount: '',
        notes: '',
        attachments: []
      });
      setIsEditMode(false);
      setSelectedInvoice(null);
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: 'Success',
        description: 'Invoice updated successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ id, status, paymentReference }: { id: number; status: string; paymentReference?: string }) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, paymentReference })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update invoice status');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsPaymentModalVisible(false);
      setPaymentReference('');
      setMarkAsPaid(false);
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: 'Success',
        description: 'Payment recorded successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formValues.vendorId) {
      toast({
        title: 'Error',
        description: 'Please select a vendor',
        variant: 'destructive'
      });
      return;
    }

    if (!formValues.wastePointIds.length) {
      toast({
        title: 'Error',
        description: 'Please select at least one waste point',
        variant: 'destructive'
      });
      return;
    }

    if (!formValues.issueDate) {
      toast({
        title: 'Error',
        description: 'Please select an issue date',
        variant: 'destructive'
      });
      return;
    }

    if (!formValues.dueDate) {
      toast({
        title: 'Error',
        description: 'Please select a due date',
        variant: 'destructive'
      });
      return;
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (formValues.issueDate < today) {
      toast({
        title: 'Error',
        description: 'Issue date cannot be in the past',
        variant: 'destructive'
      });
      return;
    }

    if (formValues.dueDate < formValues.issueDate) {
      toast({
        title: 'Error',
        description: 'Due date cannot be before issue date',
        variant: 'destructive'
      });
      return;
    }

    // Check if due date is more than 1 year in the future
    const maxDueDate = new Date();
    maxDueDate.setFullYear(maxDueDate.getFullYear() + 1);
    if (formValues.dueDate > maxDueDate) {
      toast({
        title: 'Error',
        description: 'Due date cannot be more than 1 year in the future',
        variant: 'destructive'
      });
      return;
    }

    // Validate total amount
    const totalAmount = parseFloat(formValues.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid total amount greater than 0',
        variant: 'destructive'
      });
      return;
    }

    // Check if total amount is too large (e.g., more than $1 million)
    const maxAmount = 1000000;
    if (totalAmount > maxAmount) {
      toast({
        title: 'Error',
        description: 'Total amount cannot exceed $1,000,000',
        variant: 'destructive'
      });
      return;
    }

    // Validate notes length
    const maxNotesLength = 1000;
    if (formValues.notes && formValues.notes.length > maxNotesLength) {
      toast({
        title: 'Error',
        description: 'Notes cannot exceed 1000 characters',
        variant: 'destructive'
      });
      return;
    }

    const formData = new FormData();
    formData.append('vendorId', formValues.vendorId);
    formData.append('customerId', formValues.vendorId.toString());
    formData.append('issueDate', formValues.issueDate.toISOString());
    formData.append('dueDate', formValues.dueDate.toISOString());
    formData.append('totalAmount', totalAmount.toFixed(2));
    formData.append('notes', formValues.notes || '');
    formData.append('wastePointIds', JSON.stringify(formValues.wastePointIds));
    
    // Append each file to the FormData
    formValues.attachments.forEach((file) => {
      formData.append('attachments', file);
    });

    if (isEditMode && selectedInvoice) {
      updateInvoice.mutate({ id: selectedInvoice.id, formData });
    } else {
      createInvoice.mutate(formData);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      const maxTotalSize = 50 * 1024 * 1024; // 50MB total
      const maxFileNameLength = 255; // Maximum file name length
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];
      const maxAttachments = 5;
      
      // Check if adding new files would exceed the maximum
      if (formValues.attachments.length + newFiles.length > maxAttachments) {
        toast({
          title: 'Error',
          description: `Cannot add more than ${maxAttachments} attachments`,
          variant: 'destructive'
        });
        return;
      }

      // Check total size
      const currentTotalSize = formValues.attachments.reduce((sum, file) => sum + file.size, 0);
      const newTotalSize = currentTotalSize + newFiles.reduce((sum, file) => sum + file.size, 0);
      if (newTotalSize > maxTotalSize) {
        toast({
          title: 'Error',
          description: 'Total size of all attachments cannot exceed 50MB',
          variant: 'destructive'
        });
        return;
      }
      
      // Check file sizes
      const oversizedFiles = newFiles.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        toast({
          title: 'Error',
          description: `The following files exceed the 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`,
          variant: 'destructive'
        });
        return;
      }

      // Check file types
      const invalidTypes = newFiles.filter(file => !allowedTypes.includes(file.type));
      if (invalidTypes.length > 0) {
        toast({
          title: 'Error',
          description: `The following files have unsupported types: ${invalidTypes.map(f => f.name).join(', ')}`,
          variant: 'destructive'
        });
        return;
      }

      // Check file name lengths
      const longFileNames = newFiles.filter(file => file.name.length > maxFileNameLength);
      if (longFileNames.length > 0) {
        toast({
          title: 'Error',
          description: `The following files have names that are too long: ${longFileNames.map(f => f.name).join(', ')}`,
          variant: 'destructive'
        });
        return;
      }

      // Check for invalid characters in file names
      const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
      const invalidFileNames = newFiles.filter(file => invalidChars.test(file.name));
      if (invalidFileNames.length > 0) {
        toast({
          title: 'Error',
          description: `The following files have invalid characters in their names: ${invalidFileNames.map(f => f.name).join(', ')}`,
          variant: 'destructive'
        });
        return;
      }

      // Check for duplicate file names
      const existingNames = new Set(formValues.attachments.map(f => f.name.toLowerCase()));
      const duplicateFiles = newFiles.filter(file => existingNames.has(file.name.toLowerCase()));
      if (duplicateFiles.length > 0) {
        toast({
          title: 'Error',
          description: `The following files have duplicate names: ${duplicateFiles.map(f => f.name).join(', ')}`,
          variant: 'destructive'
        });
        return;
      }

      // Check for duplicate file names within the new files
      const newFileNames = new Set<string>();
      const internalDuplicates = newFiles.filter(file => {
        const lowerName = file.name.toLowerCase();
        if (newFileNames.has(lowerName)) {
          return true;
        }
        newFileNames.add(lowerName);
        return false;
      });
      if (internalDuplicates.length > 0) {
        toast({
          title: 'Error',
          description: `The following files have duplicate names: ${internalDuplicates.map(f => f.name).join(', ')}`,
          variant: 'destructive'
        });
        return;
      }

      setFormValues(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles]
      }));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormValues(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const totals = invoices.reduce((acc: any, invoice: any) => {
      if (!acc[invoice.vendorName]) {
        acc[invoice.vendorName] = 0;
      }
      acc[invoice.vendorName] += invoice.totalAmount;
      return acc;
    }, {});

    return Object.entries(totals).map(([vendor, total]) => ({
      vendor,
      total,
    }));
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalVisible(true);
  };

  const handleEditInvoice = () => {
    if (selectedInvoice) {
      setFormValues({
        vendorId: selectedInvoice.vendorId.toString(),
        wastePointIds: selectedInvoice.wastePointIds || [],
        issueDate: new Date(selectedInvoice.issueDate),
        dueDate: new Date(selectedInvoice.dueDate),
        totalAmount: selectedInvoice.totalAmount.toString(),
        notes: selectedInvoice.notes || '',
        attachments: []
      });
      setIsEditMode(true);
      setIsViewModalVisible(false);
      setIsModalVisible(true);
    }
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalVisible(true);
  };

  const handlePaymentSubmit = () => {
    if (!selectedInvoice) return;

    if (!markAsPaid && !paymentReference) {
      toast({
        title: 'Error',
        description: 'Please either enter a payment reference or mark as paid',
        variant: 'destructive'
      });
      return;
    }

    updateInvoiceStatus.mutate({
      id: selectedInvoice.id,
      status: 'paid',
      paymentReference: paymentReference || undefined
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div>
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            Invoicing
          </Typography>
          <Typography color="textSecondary">
            Manage and track waste management costs
          </Typography>
        </Box>

        <Stack spacing={3}>
          <Card>
            <Box p={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsModalVisible(true)}
                    sx={{ mb: 3 }}
                  >
                    Create New Invoice
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Invoice Number</TableCell>
                          <TableCell>Vendor</TableCell>
                          <TableCell>Issue Date</TableCell>
                          <TableCell>Due Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Waste Points</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell>{invoice.invoiceNumber}</TableCell>
                            <TableCell>{invoice.vendorName}</TableCell>
                            <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                            <TableCell>${invoice.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Chip
                                label={invoice.status.toUpperCase()}
                                color={
                                  invoice.status === 'paid' ? 'success' :
                                    invoice.status === 'pending' ? 'warning' : 'error'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                {invoice.wastePoints?.map((wastePointId) => {
                                  const wastePoint = wastePoints.find(wp => wp.id === wastePointId);
                                  return (
                                    <Chip
                                      key={wastePointId}
                                      label={wastePoint?.process_step || 'Unknown'}
                                      size="small"
                                      variant="outlined"
                                    />
                                  );
                                })}
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Button
                                  startIcon={<EditIcon />}
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleViewInvoice(invoice)}
                                >
                                  View
                                </Button>
                                {invoice.status === 'paid' ? (
                                  <Button
                                    startIcon={<MoneyIcon />}
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    disabled
                                  >
                                    Paid
                                  </Button>
                                ) : (
                                  <Button
                                    startIcon={<MoneyIcon />}
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleRecordPayment(invoice)}
                                  >
                                    Record Payment
                                  </Button>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          </Card>

          <Card>
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Cost Summary
              </Typography>
              <Grid container spacing={3}>
                {calculateTotals().map(({ vendor, total }) => (
                  <Grid item xs={12} sm={6} md={4} key={vendor}>
                    <Card variant="outlined">
                      <Box p={2}>
                        <Typography color="textSecondary" gutterBottom>
                          {vendor}
                        </Typography>
                        <Typography variant="h4">
                          ${(total as number).toFixed(2)}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Card>
        </Stack>

        <Dialog
          open={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
            setFormValues({
              vendorId: '',
              wastePointIds: [],
              issueDate: null,
              dueDate: null,
              totalAmount: '',
              notes: '',
              attachments: []
            });
            setIsEditMode(false);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{isEditMode ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3} sx={{ mt: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    label="Vendor"
                    required
                    value={formValues.vendorId}
                    onChange={(e) => setFormValues(prev => ({ ...prev, vendorId: e.target.value }))}
                  >
                    {organizationVendors
                      .filter(orgVendor => orgVendor.status === 'active')
                      .map((orgVendor) => (
                        <MenuItem key={orgVendor.vendor.id} value={orgVendor.vendor.id}>
                          {orgVendor.vendor.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Waste Points</InputLabel>
                  <Select
                    multiple
                    label="Waste Points"
                    required
                    value={formValues.wastePointIds}
                    onChange={(e) => setFormValues(prev => ({ 
                      ...prev, 
                      wastePointIds: e.target.value as number[] 
                    }))}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const wastePoint = wastePoints.find(wp => wp.id === value);
                          return (
                            <Chip 
                              key={value} 
                              label={wastePoint?.process_step || 'Unknown'} 
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {wastePoints.map((wastePoint) => (
                      <MenuItem key={wastePoint.id} value={wastePoint.id}>
                        {wastePoint.process_step}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <DatePicker
                  label="Issue Date"
                  value={formValues.issueDate}
                  onChange={(date) => setFormValues(prev => ({ ...prev, issueDate: date }))}
                />

                <DatePicker
                  label="Due Date"
                  value={formValues.dueDate}
                  onChange={(date) => setFormValues(prev => ({ ...prev, dueDate: date }))}
                />

                <TextField
                  label="Total Amount"
                  type="number"
                  required
                  fullWidth
                  value={formValues.totalAmount}
                  onChange={(e) => setFormValues(prev => ({ ...prev, totalAmount: e.target.value }))}
                  InputProps={{
                    startAdornment: '$'
                  }}
                />

                <TextField
                  label="Notes"
                  multiline
                  rows={4}
                  fullWidth
                  value={formValues.notes}
                  onChange={(e) => setFormValues(prev => ({ ...prev, notes: e.target.value }))}
                />

                <Box>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  />
                  <label htmlFor="file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<AttachFileIcon />}
                    >
                      Upload Attachments
                    </Button>
                  </label>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    Supported formats: PDF, Word, JPEG, PNG, GIF (max 10MB each)
                  </Typography>
                </Box>

                {formValues.attachments.length > 0 && (
                  <List>
                    {formValues.attachments.map((file, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <DescriptionIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={file.name}
                          secondary={`${(file.size / 1024).toFixed(1)} KB`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}

                <DialogActions>
                  <Button onClick={() => {
                    setIsModalVisible(false);
                    setIsEditMode(false);
                  }}>Cancel</Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={createInvoice.isPending || updateInvoice.isPending}
                  >
                    {isEditMode 
                      ? (updateInvoice.isPending ? 'Updating...' : 'Update Invoice')
                      : (createInvoice.isPending ? 'Creating...' : 'Create Invoice')
                    }
                  </Button>
                </DialogActions>
              </Stack>
            </form>
          </DialogContent>
        </Dialog>

        {/* View/Edit Invoice Modal */}
        <Dialog
          open={isViewModalVisible}
          onClose={() => {
            setIsViewModalVisible(false);
            setSelectedInvoice(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Invoice Details</DialogTitle>
          <DialogContent>
            {selectedInvoice && (
              <Stack spacing={3} sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Invoice Number
                    </Typography>
                    <Typography variant="body1">
                      {selectedInvoice.invoiceNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedInvoice.status.toUpperCase()}
                      color={
                        selectedInvoice.status === 'paid' ? 'success' :
                          selectedInvoice.status === 'pending' ? 'warning' : 'error'
                      }
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Vendor
                    </Typography>
                    <Typography variant="body1">
                      {selectedInvoice.vendorName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="body1">
                      ${selectedInvoice.totalAmount.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Issue Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Due Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>

                {selectedInvoice.attachments && selectedInvoice.attachments.length > 0 && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Attachments
                    </Typography>
                    <List>
                      {selectedInvoice.attachments.map((attachment) => (
                        <ListItem key={attachment.id}>
                          <ListItemIcon>
                            <DescriptionIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={attachment.fileName}
                            secondary={`${(attachment.fileSize / 1024).toFixed(1)} KB`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              aria-label="download"
                              onClick={() => window.open(attachment.fileUrl, '_blank')}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsViewModalVisible(false)}>Close</Button>
            {selectedInvoice?.status !== 'paid' && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditInvoice}
              >
                Edit Invoice
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Payment Modal */}
        <Dialog
          open={isPaymentModalVisible}
          onClose={() => {
            setIsPaymentModalVisible(false);
            setPaymentReference('');
            setMarkAsPaid(false);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Record Payment</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Typography variant="body1">
                Recording payment for invoice {selectedInvoice?.invoiceNumber}
              </Typography>
              <Typography variant="body1">
                Amount: ${selectedInvoice?.totalAmount.toFixed(2)}
              </Typography>
              
              <TextField
                label="Payment Reference Number"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                disabled={markAsPaid}
                fullWidth
              />

              <FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={markAsPaid}
                      onChange={(e) => setMarkAsPaid(e.target.checked)}
                    />
                  }
                  label="Mark as paid without reference number"
                />
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setIsPaymentModalVisible(false);
              setPaymentReference('');
              setMarkAsPaid(false);
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handlePaymentSubmit}
              disabled={updateInvoiceStatus.isPending}
            >
              {updateInvoiceStatus.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </LocalizationProvider>
  );
}