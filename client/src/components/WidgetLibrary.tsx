import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

const WidgetLibrary = () => {
  const [widgets, setWidgets] = useState([]);

  const handleDragStart = (e, widget) => {
    // Implement the drag start logic here
  };

  return (
    <Box
      sx={{
        width: 300,
        bgcolor: 'background.paper',
        borderLeft: '1px solid',
        borderColor: 'divider',
        height: '100vh',
        overflowY: 'auto',
        p: 2,
      }}
    >
      <Typography variant="h6" sx={{ color: 'text.primary', mb: 2 }}>
        Widget Library
      </Typography>
      <List>
        {widgets.map((widget) => (
          <ListItem
            key={widget.id}
            draggable
            onDragStart={(e) => handleDragStart(e, widget)}
            sx={{
              bgcolor: '#A855F7',
              color: 'white',
              mb: 1,
              borderRadius: 1,
              cursor: 'move',
              '&:hover': {
                bgcolor: '#9333EA',
              },
            }}
          >
            <ListItemText
              primary={widget.title}
              secondary={widget.description}
              primaryTypographyProps={{ color: 'white' }}
              secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default WidgetLibrary; 