import { Card, CardContent, CardHeader, Typography, Box, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Assignment as ProjectIcon } from '@mui/icons-material';
import type { SelectInitiative } from "@db/schema";

const statusColors: Record<string, { color: string; background: string }> = {
  planning: { color: '#854D0E', background: '#FEF9C3' },
  active: { color: '#166534', background: '#DCFCE7' },
  completed: { color: '#1E40AF', background: '#DBEAFE' },
  cancelled: { color: '#991B1B', background: '#FEE2E2' }
};

export function InitiativeTrackingSection() {
  const { data: initiatives = [], isLoading } = useQuery<SelectInitiative[]>({
    queryKey: ['/api/initiatives/all']
  });

  const getProgress = (status: string): number => {
    switch (status) {
      case 'completed':
        return 100;
      case 'active':
        return 50;
      case 'planning':
        return 25;
      default:
        return 0;
    }
  };

  // Sort initiatives by status priority and start date
  const sortedInitiatives = [...initiatives].sort((a, b) => {
    const statusPriority = { active: 0, planning: 1, completed: 2, cancelled: 3 };
    if (statusPriority[a.status as keyof typeof statusPriority] !== statusPriority[b.status as keyof typeof statusPriority]) {
      return statusPriority[a.status as keyof typeof statusPriority] - statusPriority[b.status as keyof typeof statusPriority];
    }
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <ProjectIcon />
            <Typography variant="h6">Initiatives Progress</Typography>
          </Box>
        }
      />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Initiative</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Impact</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedInitiatives.map((initiative) => (
                <TableRow key={initiative.id}>
                  <TableCell>
                    <Typography variant="body2">
                      {initiative.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={initiative.status.toUpperCase()}
                      sx={{
                        bgcolor: statusColors[initiative.status]?.background,
                        color: statusColors[initiative.status]?.color,
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: '100%', maxWidth: 200 }}>
                      <Box sx={{ width: '100%', mb: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getProgress(initiative.status)}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Start: {new Date(initiative.startDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Waste: {initiative.estimatedImpact.wasteReduction}kg
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Cost: ${initiative.estimatedImpact.costSavings}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}