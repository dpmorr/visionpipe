import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
  CircularProgress,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  AttachMoney as MoneyIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { useVendor } from '@/hooks/use-vendor';

interface Customer {
  id: number;
  name: string;
  status: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  vendorId: number;
  customerName: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  status: string;
  notes: string | null;
  wastePoints: number[];
  attachments: InvoiceAttachment[];
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

interface FormValues {
  customerId: string;
  issueDate: Date | null;
  dueDate: Date | null;
  totalAmount: string;
  notes: string;
  attachments: File[];
  wastePointIds: number[];
}

export default function VendorInvoices() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({
    customerId: '',
    issueDate: null,
    dueDate: null,
    totalAmount: '',
    notes: '',
    attachments: [],
    wastePointIds: []
  });
  const { toast } = useToast();
  const { vendor, isLoading: isVendorLoading } = useVendor();
  const vendorId = vendor?.id;

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/vendor/invoices'],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/vendor/customers'],
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
        customerId: '',
        issueDate: null,
        dueDate: null,
        totalAmount: '',
        notes: '',
        attachments: [],
        wastePointIds: []
      });
      toast({
        title: 'Success',
        description: 'Invoice created successfully'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Vendor ID not found. Please try again.",
      });
      return;
    }

    const formData = new FormData();
    formData.append('vendorId', vendorId.toString());
    formData.append('customerId', formValues.customerId);
    formData.append('issueDate', formValues.issueDate?.toISOString() || '');
    formData.append('dueDate', formValues.dueDate?.toISOString() || '');
    formData.append('totalAmount', formValues.totalAmount);
    formData.append('notes', formValues.notes || '');
    formData.append('wastePointIds', JSON.stringify(formValues.wastePointIds));
    
    // Append each file to the FormData
    formValues.attachments.forEach((file) => {
      formData.append('attachments', file);
    });

    createInvoice.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
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
    const pending = invoices.reduce((sum, invoice) => 
      invoice.status === 'pending' ? sum + invoice.totalAmount : sum, 0);
    const paid = invoices.reduce((sum, invoice) => 
      invoice.status === 'paid' ? sum + invoice.totalAmount : sum, 0);

    return { pending, paid };
  };

  const totals = calculateTotals();

  if (isVendorLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!vendor) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Vendor information not found. Please try logging in again.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Invoices"
        subtitle="Manage your invoices and track payments"
        extra={[
          <Button
            key="create"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsModalVisible(true)}
          >
            Create Invoice
          </Button>
        ]}
      />

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Attachments</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.customerName}</TableCell>
                <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                <TableCell>${invoice.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={invoice.status}
                    color={
                      invoice.status === 'paid'
                        ? 'success'
                        : invoice.status === 'overdue'
                        ? 'error'
                        : 'warning'
                    }
                  />
                </TableCell>
                <TableCell>
                  {invoice.attachments?.length > 0 ? (
                    <Tooltip title={invoice.attachments.map(a => a.fileName).join(', ')}>
                      <Chip
                        icon={<AttachFileIcon />}
                        label={`${invoice.attachments.length} file(s)`}
                        variant="outlined"
                        size="small"
                      />
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No attachments
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small">
                      <DownloadIcon />
                    </IconButton>
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Card>
        <Box p={3}>
          <Typography variant="h6" gutterBottom>
            Invoice Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <Box p={2}>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Payments
                  </Typography>
                  <Typography variant="h4">
                    ${totals.pending.toFixed(2)}
                  </Typography>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <Box p={2}>
                  <Typography color="textSecondary" gutterBottom>
                    Total Paid
                  </Typography>
                  <Typography variant="h4">
                    ${totals.paid.toFixed(2)}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Dialog
        open={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setFormValues({
            customerId: '',
            issueDate: null,
            dueDate: null,
            totalAmount: '',
            notes: '',
            attachments: [],
            wastePointIds: []
          });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Invoice</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select
                  label="Customer"
                  value={formValues.customerId}
                  onChange={(e) => setFormValues(prev => ({ ...prev, customerId: e.target.value }))}
                >
                  {customers
                    .filter(customer => customer.status === 'active')
                    .map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Waste Points</InputLabel>
                <Select
                  multiple
                  label="Waste Points"
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
                            label={wastePoint?.name || 'Unknown'} 
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {wastePoints.map((wastePoint) => (
                    <MenuItem key={wastePoint.id} value={wastePoint.id}>
                      {wastePoint.name}
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
                value={formValues.totalAmount}
                onChange={(e) => setFormValues(prev => ({ ...prev, totalAmount: e.target.value }))}
                fullWidth
                InputProps={{
                  startAdornment: '$'
                }}
              />

              <TextField
                label="Notes"
                multiline
                rows={4}
                value={formValues.notes || ''}
                onChange={(e) => setFormValues(prev => ({ ...prev, notes: e.target.value }))}
                fullWidth
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
                <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={createInvoice.isPending}
                >
                  {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
                </Button>
              </DialogActions>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}