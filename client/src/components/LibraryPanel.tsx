import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  InputAdornment,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useState } from 'react';

interface LibraryItem {
  id: string;
  title: string;
  type: string;
  description?: string;
  schedule?: string;
  isStandard?: boolean;
}

interface LibraryPanelProps {
  items: LibraryItem[];
  selectedItemId: string | null;
  onItemSelect: (item: LibraryItem) => void;
  type: 'chart' | 'analysis' | 'report';
}

export function LibraryPanel({ items, selectedItemId, onItemSelect, type }: LibraryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [standardOpen, setStandardOpen] = useState(true);
  const [createdOpen, setCreatedOpen] = useState(true);

  // Filter items based on search term
  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Explicitly separate standard and created items
  const standardItems = filteredItems.filter(item => item.isStandard === true);
  const createdItems = filteredItems.filter(item => item.isStandard !== true);

  const renderItems = (items: LibraryItem[]) => (
    <List sx={{ pl: 2 }}>
      {items.map((item) => (
        <ListItem key={item.id} disablePadding>
          <ListItemButton 
            selected={item.id === selectedItemId}
            onClick={() => onItemSelect(item)}
            className={item.id === selectedItemId ? 'selected' : ''}
          >
            <ListItemText 
              primary={item.title}
              secondary={
                <Box component="span" sx={{ display: 'block' }}>
                  {item.description && (
                    <Typography variant="body2" noWrap>
                      {item.description}
                    </Typography>
                  )}
                  {item.schedule && (
                    <Typography variant="caption" display="block">
                      Schedule: {item.schedule}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ 
      width: '300px', 
      borderRight: '1px solid',
      borderColor: 'divider',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {type === 'chart' ? 'Charts Library' : type === 'analysis' ? 'Analysis Library' : 'Reports Library'}
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Filter">
                  <IconButton size="small">
                    <FilterIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />
      </Box>

      <Divider />

      <Box sx={{ 
        overflowY: 'auto',
        flex: 1,
        '& .MuiListItemButton-root.selected': {
          bgcolor: 'action.selected'
        }
      }}>
        {/* Standard Items Section */}
        <ListItem sx={{ pt: 1 }}>
          <ListItemButton onClick={() => setStandardOpen(!standardOpen)} dense>
            <ListItemText 
              primary={
                <Typography variant="subtitle2" color="text.secondary">
                  Standard
                </Typography>
              }
            />
            {standardOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={standardOpen}>
          {renderItems(standardItems)}
        </Collapse>

        {/* Created Items Section */}
        <ListItem sx={{ pt: 1 }}>
          <ListItemButton onClick={() => setCreatedOpen(!createdOpen)} dense>
            <ListItemText 
              primary={
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
              }
            />
            {createdOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={createdOpen}>
          {renderItems(createdItems)}
        </Collapse>
      </Box>
    </Box>
  );
} 

export default LibraryPanel; 