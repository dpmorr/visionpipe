import { Card, CardContent, CardHeader, Grid, Typography, Box } from '@mui/material';
import { Link } from 'wouter';
import { BoltOutlined as ThunderboltIcon } from '@mui/icons-material';
import type { QuickAction } from '@/lib/dashboardStore';

interface QuickActionsSectionProps {
  actions: QuickAction[];
}

export function QuickActionsSection({ actions }: QuickActionsSectionProps) {
  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <ThunderboltIcon />
            <Typography variant="h6">Quick Actions</Typography>
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          {actions.map(action => (
            <Grid item xs={12} sm={6} md={3} key={action.title}>
              <Link href={action.link}>
                <Card
                  sx={{
                    height: '100%',
                    bgcolor: action.bgColor,
                    borderColor: action.color,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}
                >
                  <CardContent>
                    <Box 
                      display="flex" 
                      flexDirection="column" 
                      alignItems="center" 
                      gap={1}
                    >
                      <Box sx={{ color: action.color }}>
                        {action.icon}
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: action.color,
                          textAlign: 'center',
                          mb: 1
                        }}
                      >
                        {action.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ textAlign: 'center' }}
                      >
                        {action.description}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}