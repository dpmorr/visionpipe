import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Button,
  Box,
  Grid,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  MenuBook,
  School,
  Assessment,
  Psychology,
  Campaign,
  BusinessCenter,
  LocalLibrary,
  Build,
  Group,
  Slideshow,
  Timeline
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function Training() {
  const theme = useTheme();
  const [, navigate] = useLocation();

  const libraryCards = [
    {
      icon: <MenuBook />,
      title: "Best Practices Guides",
      description: "Comprehensive guides covering industry best practices and standards.",
      type: "Documentation",
      slug: "best-practices-guides"
    },
    {
      icon: <Slideshow />,
      title: "Video Tutorials",
      description: "Step-by-step video guides for implementing sustainable practices.",
      type: "Video",
      slug: "video-tutorials"
    },
    {
      icon: <School />,
      title: "Certification Courses",
      description: "Professional certification programs in sustainability management.",
      type: "Course",
      slug: "certification-courses"
    },
    {
      icon: <Assessment />,
      title: "Assessment Tools",
      description: "Tools and templates for evaluating sustainability performance.",
      type: "Tools",
      slug: "assessment-tools"
    },
    {
      icon: <Timeline />,
      title: "Case Studies",
      description: "Real-world examples of successful sustainability initiatives.",
      type: "Case Study",
      slug: "case-studies"
    },
    {
      icon: <Psychology />,
      title: "Interactive Workshops",
      description: "Hands-on training sessions with industry experts.",
      type: "Workshop",
      slug: "interactive-workshops"
    },
    {
      icon: <Campaign />,
      title: "Awareness Programs",
      description: "Employee engagement and awareness campaign materials.",
      type: "Program",
      slug: "awareness-programs"
    },
    {
      icon: <BusinessCenter />,
      title: "Industry Reports",
      description: "In-depth analysis of sustainability trends and benchmarks.",
      type: "Report",
      slug: "industry-reports"
    },
    {
      icon: <LocalLibrary />,
      title: "Research Papers",
      description: "Academic and industry research on sustainable practices.",
      type: "Research",
      slug: "research-papers"
    },
    {
      icon: <Build />,
      title: "Implementation Guides",
      description: "Practical guides for implementing sustainability initiatives.",
      type: "Guide",
      slug: "implementation-guides"
    },
    {
      icon: <Group />,
      title: "Community Forums",
      description: "Discussion forums for sharing experiences and best practices.",
      type: "Community",
      slug: "community-forums"
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Training Library"
        subtitle="Access comprehensive training materials and resources"
      />

      <Paper sx={{ width: '100%', mb: 3, p: 3 }}>
        <Grid container spacing={3}>
          {libraryCards.map((card, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  avatar={
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main'
                      }}
                    >
                      {card.icon}
                    </Box>
                  }
                  title={card.title}
                  subheader={
                    <Chip
                      label={card.type}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" fullWidth onClick={() => navigate(`/training/${card.slug}`)}>
                    Access Content
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}
