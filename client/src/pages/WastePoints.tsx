import { useState, useEffect } from 'react';
import { 
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Stack,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import PageHeader from "@/components/PageHeader";
import AddWastePointModal from '@/components/AddWastePointModal';
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ReactFlowProvider } from 'reactflow';
import FlowChart from '@/components/FlowChart';
import PickupSchedule from '@/pages/PickupSchedule';
import styles from './WastePoints.module.css';
import { WastePoint, WastePointFormData } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button as ShadButton } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`waste-point-tabpanel-${index}`}
      aria-labelledby={`waste-point-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `waste-point-tab-${index}`,
    'aria-controls': `waste-point-tabpanel-${index}`,
  };
}

export default function WastePoints() {
  const queryClient: QueryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWastePoint, setEditingWastePoint] = useState<WastePoint | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [flowChartRef, setFlowChartRef] = useState<any>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditWastePoint, setAuditWastePoint] = useState<WastePoint | null>(null);
  const [auditForm, setAuditForm] = useState({
    date: '',
    auditor: '',
    notes: '',
    volume: '',
    wasteType: '',
  });
  const [lastAuditDates, setLastAuditDates] = useState<Record<number, string>>({});

  const { data: wastePoints = [], isLoading } = useQuery<WastePoint[]>({
    queryKey: ['/api/waste-points'],
  });

  const hasWastePoints = Array.isArray(wastePoints) && wastePoints.length > 0;

  // Fetch last audit date for all waste points
  useEffect(() => {
    async function fetchAuditDates() {
      if (!Array.isArray(wastePoints) || wastePoints.length === 0) return;
      const results: Record<number, string> = {};
      await Promise.all(wastePoints.map(async (wp) => {
        try {
          const res = await fetch(`/api/waste-audits/${wp.id}`);
          if (!res.ok) {
            console.error(`Failed to fetch audits for waste point ${wp.id}:`, res.status, await res.text());
            results[wp.id] = '';
            return;
          }
          let audits;
          try {
            audits = await res.json();
          } catch (err) {
            console.error(`Non-JSON response for waste point ${wp.id}:`, err);
            results[wp.id] = '';
            return;
          }
          if (Array.isArray(audits) && audits.length > 0 && audits[0].date) {
            results[wp.id] = audits[0].date;
          } else {
            results[wp.id] = '';
          }
        } catch (err) {
          console.error(`Error fetching audits for waste point ${wp.id}:`, err);
          results[wp.id] = '';
        }
      }));
      setLastAuditDates(results);
    }
    fetchAuditDates();
  }, [wastePoints]);

  const addWastePointMutation = useMutation({
    mutationFn: async (data: WastePointFormData) => {
      const res = await fetch('/api/waste-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create waste point');
      return res.json();
    },
    onSuccess: (data) => {
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/waste-points'] });
      toast.success("Waste point added successfully");

      if (tabValue === 1 && flowChartRef) {
        flowChartRef(data);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateWastePointMutation = useMutation({
    mutationFn: async (data: WastePointFormData & { id: number }) => {
      console.log('Updating waste point with data:', data);
      const res = await fetch(`/api/waste-points/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          processStep: data.processStep,
          wasteType: data.wasteType,
          estimatedVolume: data.estimatedVolume,
          unit: data.unit,
          vendor: data.vendor,
          notes: data.notes,
          locationData: data.locationData,
          interval: data.interval
        }),
      });
      if (!res.ok) throw new Error('Failed to update waste point');
      return res.json();
    },
    onSuccess: (data) => {
      setIsEditModalOpen(false);
      setEditingWastePoint(null);
      queryClient.invalidateQueries({ queryKey: ['/api/waste-points'] });
      toast.success("Waste point updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteWastePointMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/waste-points/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete waste point');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/waste-points'] });
      toast.success("Waste point deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAddPoint = (formData: WastePointFormData) => {
    addWastePointMutation.mutate(formData);
  };

  const handleEdit = (wastePoint: WastePoint) => {
    setEditingWastePoint(wastePoint);
    setIsEditModalOpen(true);
  };

  const handleUpdatePoint = (formData: WastePointFormData) => {
    if (editingWastePoint) {
      updateWastePointMutation.mutate({
        ...formData,
        id: editingWastePoint.id,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this waste point?')) {
      deleteWastePointMutation.mutate(id);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (!hasWastePoints && (newValue === 1 || newValue === 2)) {
      toast.error("Please add at least one waste point before accessing additional features");
      return;
    }
    setTabValue(newValue);
  };

  const handleOpenAudit = (wastePoint: WastePoint) => {
    setAuditWastePoint(wastePoint);
    setAuditForm({
      date: '',
      auditor: '',
      notes: '',
      volume: '',
      wasteType: wastePoint.wasteType || '',
    });
    setIsAuditModalOpen(true);
  };

  const handleAuditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAuditForm({ ...auditForm, [e.target.name]: e.target.value });
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditWastePoint) return;
    try {
      const res = await fetch('/api/waste-audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wastePointId: auditWastePoint.id,
          ...auditForm,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit audit');
      // Refetch audits for this waste point
      const auditsRes = await fetch(`/api/waste-audits/${auditWastePoint.id}`);
      if (auditsRes.ok) {
        const audits = await auditsRes.json();
        setLastAuditDates((prev) => ({ ...prev, [auditWastePoint.id]: audits[0]?.date || '' }));
      }
    } catch (err) {
      toast.error('Failed to submit audit');
    }
    setIsAuditModalOpen(false);
    setAuditWastePoint(null);
  };

  const columns: GridColDef<WastePoint>[] = [
    { field: 'process_step', headerName: 'Process Step', flex: 1 },
    { field: 'wasteType', headerName: 'Waste Type', flex: 1 },
    { 
      field: 'estimatedVolume',
      headerName: 'Est. Volume',
      flex: 1,
      renderCell: (params: GridRenderCellParams<WastePoint>) => {
        return `${params.row.estimatedVolume} ${params.row.unit}`;
      }
    },
    { field: 'vendor', headerName: 'Vendor', flex: 1 },
    {
      field: 'interval',
      headerName: 'Pickup Frequency',
      flex: 1,
      renderCell: (params: GridRenderCellParams<WastePoint>) => {
        const interval = params.row.interval || 'weekly';
        const tooltipText = {
          'daily': 'Waste collected every day',
          'weekly': 'Waste collected once per week',
          'monthly': 'Waste collected once per month',
          'quarterly': 'Waste collected every 3 months',
          'yearly': 'Waste collected once per year'
        }[interval];

        return (
          <Tooltip title={tooltipText}>
            <span>{interval.charAt(0).toUpperCase() + interval.slice(1)}</span>
          </Tooltip>
        );
      }
    },
    {
      field: 'locationData',
      headerName: 'Location',
      flex: 1,
      renderCell: (params: GridRenderCellParams<WastePoint>) => {
        return params.row.locationData?.address || 'No location set';
      }
    },
    { field: 'notes', headerName: 'Notes', flex: 1 },
    {
      field: 'lastAudit',
      headerName: 'Last Audit',
      flex: 1,
      renderCell: (params: GridRenderCellParams<WastePoint>) => {
        const date = lastAuditDates[params.row.id];
        if (!date) return 'Never';
        const d = new Date(date);
        return isNaN(d.getTime()) ? 'Never' : d.toISOString().slice(0, 10);
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      renderCell: (params: GridRenderCellParams<WastePoint>) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton
            onClick={() => handleEdit(params.row)}
            size="small"
            color="primary"
            sx={{ p: 0, minWidth: 32, minHeight: 32 }}
          >
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton
            onClick={() => handleDelete(params.row.id)}
            size="small"
            color="error"
            sx={{ p: 0, minWidth: 32, minHeight: 32 }}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
          <Tooltip title="Lodge Manual Audit">
            <IconButton
              onClick={() => handleOpenAudit(params.row)}
              size="small"
              color="secondary"
              sx={{ p: 0, minWidth: 32, minHeight: 32 }}
            >
              <span role="img" aria-label="audit">📝</span>
            </IconButton>
          </Tooltip>
        </Box>
      ),
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          px: 3
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            m: 0,
            p: 0
          }}
        >
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="waste points tabs"
          >
            <Tab 
              label="Waste Points List" 
              {...a11yProps(0)}
            />
            <Tab 
              label="Pickup Schedule"
              disabled={!hasWastePoints}
              {...a11yProps(1)}
              sx={{
                opacity: hasWastePoints ? 1 : 0.5,
                '&.Mui-disabled': {
                  color: 'text.disabled',
                },
              }}
            />
          </Tabs>
          <Button
            variant="contained"
            startIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsModalOpen(true)}
            color="primary"
            sx={{ 
              px: 3, 
              my: 1,
              backgroundColor: '#04a2fe',
              '&:hover': {
                backgroundColor: '#0388d4',
              }
            }}
          >
            Add Waste Point
          </Button>
        </Box>
      </Box>

      <Box sx={{ bgcolor: 'background.default' }}>
        <Box sx={{ width: '100%', py: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3 }}>
              <DataGrid<WastePoint>
                rows={wastePoints}
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
                }}
                loading={isLoading}
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {hasWastePoints ? (
              <PickupSchedule />
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Please add at least one waste point to view the pickup schedule.
                </Typography>
              </Box>
            )}
          </TabPanel>
        </Box>
      </Box>

      <AddWastePointModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddPoint}
      />

      <AddWastePointModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingWastePoint(null);
        }}
        onSubmit={handleUpdatePoint}
        initialData={editingWastePoint}
      />
      {/* Manual Waste Audit Modal */}
      <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
        <DialogContent>
          <form onSubmit={handleAuditSubmit}>
            <DialogHeader>
              <DialogTitle>Lodge Manual Waste Audit</DialogTitle>
            </DialogHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Label htmlFor="audit-date">Date</Label>
              <Input
                id="audit-date"
                name="date"
                type="date"
                value={auditForm.date}
                onChange={handleAuditFormChange}
                required
              />
              <Label htmlFor="audit-auditor">Auditor</Label>
              <Input
                id="audit-auditor"
                name="auditor"
                value={auditForm.auditor}
                onChange={handleAuditFormChange}
                required
              />
              <Label htmlFor="audit-wasteType">Waste Type</Label>
              <Input
                id="audit-wasteType"
                name="wasteType"
                value={auditForm.wasteType}
                onChange={handleAuditFormChange}
                required
              />
              <Label htmlFor="audit-volume">Volume</Label>
              <Input
                id="audit-volume"
                name="volume"
                type="number"
                value={auditForm.volume}
                onChange={handleAuditFormChange}
                required
              />
              <Label htmlFor="audit-notes">Notes</Label>
              <Textarea
                id="audit-notes"
                name="notes"
                value={auditForm.notes}
                onChange={handleAuditFormChange}
                rows={3}
              />
            </div>
            <DialogFooter style={{ marginTop: 16 }}>
              <ShadButton type="submit" variant="default">
                Lodge Audit
              </ShadButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}