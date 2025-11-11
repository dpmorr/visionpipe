import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ViewList as ListIcon,
  Dashboard as LayoutDashboard,
  Timeline as LucideGanttChart,
  Delete as Trash2,
  Download as FileDown,
  Add as AddIcon
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Tab,
  Tabs,
  LinearProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  AlertTitle,
  FormHelperText
} from '@mui/material';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';

import { insertInitiativeSchema, type SelectInitiative } from "@db/schema";
import GanttChart from "@/components/GanttChart";
import KanbanBoard from "@/components/KanbanBoard";

const statusColors: Record<string, { bgcolor: string; color: string }> = {
  planning: { bgcolor: '#FEF9C3', color: '#854D0E' },
  active: { bgcolor: '#DCFCE7', color: '#166534' },
  completed: { bgcolor: '#DBEAFE', color: '#1E40AF' },
  cancelled: { bgcolor: '#FEE2E2', color: '#991B1B' }
};

export function InitiativeEditDialog({
  initiative,
  isOpen,
  onOpenChange
}: {
  initiative: SelectInitiative | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(insertInitiativeSchema),
    defaultValues: {
      title: initiative?.title || "",
      description: initiative?.description || "",
      category: initiative?.category || "circular",
      startDate: initiative?.startDate ? new Date(initiative.startDate).toISOString().split('T')[0] : "",
      targetDate: initiative?.targetDate ? new Date(initiative.targetDate).toISOString().split('T')[0] : "",
      status: initiative?.status || "planning",
      estimatedImpact: {
        wasteReduction: initiative?.estimatedImpact?.wasteReduction || 0,
        costSavings: initiative?.estimatedImpact?.costSavings || 0,
        carbonReduction: initiative?.estimatedImpact?.carbonReduction || 0
      }
    }
  });

  useEffect(() => {
    if (initiative) {
      reset({
        title: initiative.title,
        description: initiative.description,
        category: initiative.category,
        startDate: new Date(initiative.startDate).toISOString().split('T')[0],
        targetDate: new Date(initiative.targetDate).toISOString().split('T')[0],
        status: initiative.status,
        estimatedImpact: {
          wasteReduction: initiative.estimatedImpact.wasteReduction,
          costSavings: initiative.estimatedImpact.costSavings,
          carbonReduction: initiative.estimatedImpact.carbonReduction
        }
      });
    }
  }, [initiative, reset]);

  const updateInitiativeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/initiatives/${initiative?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives/all'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Failed to update initiative:', error);
    }
  });

  return (
    <Dialog open={isOpen} onClose={() => onOpenChange(false)} maxWidth="md" fullWidth>
      <DialogTitle>Edit Initiative</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit((data) => updateInitiativeMutation.mutate(data))} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Title"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Description"
                    multiline
                    rows={4}
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Controller
                  name="category"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Select
                        {...field}
                        label="Category"
                        error={!!fieldState.error}
                      >
                        <MenuItem value="circular">Circular Economy</MenuItem>
                        <MenuItem value="recycling">Recycling</MenuItem>
                        <MenuItem value="waste">Waste Management</MenuItem>
                      </Select>
                      {fieldState.error && (
                        <FormHelperText error>{fieldState.error.message}</FormHelperText>
                      )}
                    </>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="startDate"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Start Date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="targetDate"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Target Date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Controller
                  name="status"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Select
                        {...field}
                        label="Status"
                        error={!!fieldState.error}
                      >
                        <MenuItem value="planning">Planning</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                      {fieldState.error && (
                        <FormHelperText error>{fieldState.error.message}</FormHelperText>
                      )}
                    </>
                  )}
                />
              </FormControl>
            </Grid>
            {/* Users input */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Users</InputLabel>
                <Select label="Users" defaultValue={1}>
                  <MenuItem value={1}>Alice Smith</MenuItem>
                  <MenuItem value={2}>Bob Johnson</MenuItem>
                  <MenuItem value={3}>Charlie Lee</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="estimatedImpact.wasteReduction"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Estimated Waste Reduction (kg)"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="estimatedImpact.costSavings"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Estimated Cost Savings ($)"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="estimatedImpact.carbonReduction"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Estimated Carbon Reduction (kg)"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button type="submit" variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ProjectManagement() {
  const [currentView, setCurrentView] = useState<"kanban" | "list" | "timeline">("kanban");
  const queryClient = useQueryClient();
  const [selectedInitiative, setSelectedInitiative] = useState<SelectInitiative | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [initiativeToDelete, setInitiativeToDelete] = useState<number | null>(null);
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(insertInitiativeSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "circular",
      startDate: "",
      targetDate: "",
      status: "planning",
      estimatedImpact: {
        wasteReduction: 0,
        costSavings: 0,
        carbonReduction: 0
      }
    }
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: initiatives = [], isLoading, isError } = useQuery<SelectInitiative[]>({
    queryKey: ['/api/initiatives/all']
  });

  const createInitiativeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives/all'] });
    },
    onError: (error) => {
      console.error('Failed to create initiative:', error);
    }
  });

  const updateInitiativeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/initiatives/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/initiatives/all'] });
      const previousInitiatives = queryClient.getQueryData<SelectInitiative[]>(['/api/initiatives/all']);

      if (previousInitiatives) {
        const updatedInitiatives = previousInitiatives.map(init =>
          init.id === id ? { ...init, ...data } : init
        );

        queryClient.setQueryData<SelectInitiative[]>(['/api/initiatives/all'], updatedInitiatives);
      }

      return { previousInitiatives };
    },
    onError: (err, variables, context) => {
      if (context?.previousInitiatives) {
        queryClient.setQueryData(['/api/initiatives/all'], context.previousInitiatives);
      }
      console.error('Failed to update initiative:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives/all'] });
    }
  });

  const deleteInitiativeMutation = useMutation({
    mutationFn: async (initiativeId: number) => {
      const res = await fetch(`/api/initiatives/${initiativeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives/all'] });
      setInitiativeToDelete(null);
    },
    onError: (error) => {
      console.error('Failed to delete initiative:', error);
      setInitiativeToDelete(null);
    }
  });

  const handleUpdateStatus = (initiativeId: number, newStatus: string) => {
    updateInitiativeMutation.mutate({
      id: initiativeId,
      data: { status: newStatus }
    });
  };

  const handleEditInitiative = (initiative: SelectInitiative) => {
    setSelectedInitiative(initiative);
    setIsEditDialogOpen(true);
  };

  const getProgressByStatus = (status: string): number => {
    switch (status.toLowerCase()) {
      case 'completed': return 100;
      case 'active': return 50;
      case 'planning': return 25;
      case 'cancelled':
      default: return 0;
    }
  };

  const columnHelper = createColumnHelper<SelectInitiative>();

  const columns = useMemo(() => [
    columnHelper.accessor('title', {
      header: 'Title',
      cell: info => info.getValue()
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => (
        <Chip
          label={info.getValue()}
          sx={{
            bgcolor: statusColors[info.getValue()].bgcolor,
            color: statusColors[info.getValue()].color
          }}
        />
      )
    }),
    columnHelper.display({
      id: 'progress',
      header: 'Progress',
      cell: info => (
        <Box sx={{ width: 100 }}>
          <LinearProgress
            variant="determinate"
            value={getProgressByStatus(info.row.original.status)}
          />
        </Box>
      )
    })
  ], []);

  const table = useReactTable({
    data: initiatives,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          <AlertTitle>Error Loading Initiatives</AlertTitle>
          Unable to load initiatives. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'background.default' }}>
      <Box sx={{ width: '100%', maxWidth: '1700px', mx: 'auto', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 4, pt: 1 }}>
          <Typography variant="h4">Project Management</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Tabs value={currentView} onChange={(_, value) => setCurrentView(value)}>
              <Tab
                icon={<LayoutDashboard />}
                label="Kanban"
                value="kanban"
              />
              <Tab
                icon={<ListIcon />}
                label="List"
                value="list"
              />
              <Tab
                icon={<LucideGanttChart />}
                label="Timeline"
                value="timeline"
              />
            </Tabs>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsCreateDialogOpen(true)}
              sx={{ ml: 2 }}
            >
              Create New Initiative
            </Button>
          </Box>
        </Box>

        {/* Create Initiative Dialog */}
        <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Initiative</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit((data) => { createInitiativeMutation.mutate(data); setIsCreateDialogOpen(false); })} sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="Title"
                        fullWidth
                        error={!!errors.title}
                        helperText={errors.title?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="Description"
                        multiline
                        rows={4}
                        fullWidth
                        error={!!errors.description}
                        helperText={errors.description?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field, fieldState }) => (
                        <>
                          <Select {...field} label="Category" error={!!fieldState.error}>
                            <MenuItem value="circular">Circular Economy</MenuItem>
                            <MenuItem value="recycling">Recycling</MenuItem>
                            <MenuItem value="waste">Waste Management</MenuItem>
                          </Select>
                          {fieldState.error && (
                            <FormHelperText error>{fieldState.error.message}</FormHelperText>
                          )}
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        type="date"
                        label="Start Date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.startDate}
                        helperText={errors.startDate?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Controller
                    name="targetDate"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        type="date"
                        label="Target Date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.targetDate}
                        helperText={errors.targetDate?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field, fieldState }) => (
                        <>
                          <Select {...field} label="Status" error={!!fieldState.error}>
                            <MenuItem value="planning">Planning</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                          </Select>
                          {fieldState.error && (
                            <FormHelperText error>{fieldState.error.message}</FormHelperText>
                          )}
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>
                {/* Users input */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Users</InputLabel>
                    <Select label="Users" defaultValue={1}>
                      <MenuItem value={1}>Alice Smith</MenuItem>
                      <MenuItem value={2}>Bob Johnson</MenuItem>
                      <MenuItem value={3}>Charlie Lee</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="estimatedImpact.wasteReduction"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Estimated Waste Reduction (kg)"
                        fullWidth
                        error={!!errors.estimatedImpact?.wasteReduction}
                        helperText={errors.estimatedImpact?.wasteReduction?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="estimatedImpact.costSavings"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Estimated Cost Savings ($)"
                        fullWidth
                        error={!!errors.estimatedImpact?.costSavings}
                        helperText={errors.estimatedImpact?.costSavings?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="estimatedImpact.carbonReduction"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Estimated Carbon Reduction (kg)"
                        fullWidth
                        error={!!errors.estimatedImpact?.carbonReduction}
                        helperText={errors.estimatedImpact?.carbonReduction?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
              <DialogActions>
                <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" variant="contained" color="primary">
                  Create Initiative
                </Button>
              </DialogActions>
            </Box>
          </DialogContent>
        </Dialog>

        {/* View content */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', px: 4, pb: 2 }}>
          {currentView === "kanban" && (
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <KanbanBoard
                initiatives={initiatives}
                onUpdateStatus={handleUpdateStatus}
                onSelectInitiative={handleEditInitiative}
              />
            </Box>
          )}
          {currentView === "list" && (
            <Paper sx={{ p: 2 }}>
              <table>
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} style={{ padding: '8px', textAlign: 'left' }}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} style={{ padding: '8px' }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Paper>
          )}
          {currentView === "timeline" && (
            <Paper sx={{ p: 2, height: 'calc(100vh - 200px)' }}>
              <GanttChart
                tasks={initiatives}
                onTaskUpdate={async (taskId, updates) => {
                  updateInitiativeMutation.mutate({ id: taskId, data: updates })
                }}
                onSelectTask={handleEditInitiative}
              />
            </Paper>
          )}
        </Box>

        <InitiativeEditDialog
          initiative={selectedInitiative}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />

        {/* Delete confirmation dialog */}
        <Dialog
          open={initiativeToDelete !== null}
          onClose={() => setInitiativeToDelete(null)}
        >
          <DialogTitle>Delete Initiative</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this initiative? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInitiativeToDelete(null)}>Cancel</Button>
            <Button
              color="error"
              onClick={() => {
                if (initiativeToDelete !== null) {
                  deleteInitiativeMutation.mutate(initiativeToDelete);
                }
                setInitiativeToDelete(null);
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

export default ProjectManagement;