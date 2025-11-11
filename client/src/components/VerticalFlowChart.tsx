import React, { useState } from 'react';
import { Box, Card, Typography, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';

export default function VerticalFlowChart() {
  // Each block is an object: { id, type, label }
  const [blocks, setBlocks] = useState([
    { id: 'block-1', type: 'default', label: 'Default Block' }
  ]);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuBlockIndex, setMenuBlockIndex] = useState<number | null>(null);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [changeBlockIndex, setChangeBlockIndex] = useState<number | null>(null);

  // Add a new block below the last one
  const handleAddBlock = () => {
    setBlocks((prev) => [
      ...prev,
      { id: `block-${Date.now()}`, type: 'default', label: 'New Block' }
    ]);
  };

  // Open 3-dots menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, index: number) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuBlockIndex(index);
  };
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuBlockIndex(null);
  };

  // Open change block modal
  const handleChangeBlock = () => {
    setChangeModalOpen(true);
    setChangeBlockIndex(menuBlockIndex);
    handleMenuClose();
  };
  const handleChangeBlockSelect = (type: string, label: string) => {
    if (changeBlockIndex !== null) {
      setBlocks((prev) => prev.map((b, i) =>
        i === changeBlockIndex ? { ...b, type, label } : b
      ));
    }
    setChangeModalOpen(false);
    setChangeBlockIndex(null);
  };
  const handleChangeBlockCancel = () => {
    setChangeModalOpen(false);
    setChangeBlockIndex(null);
  };

  // Example block library
  const blockLibrary = [
    { type: 'input', label: 'Input Block' },
    { type: 'process', label: 'Process Block' },
    { type: 'output', label: 'Output Block' },
  ];

  return (
    <Box sx={{ width: 400, mx: 'auto', mt: 4 }}>
      {blocks.map((block, idx) => (
        <Box key={block.id} sx={{ position: 'relative', mb: 4 }}>
          <Card sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography>{block.label}</Typography>
            <IconButton onClick={(e) => handleMenuOpen(e, idx)}>
              <MoreVertIcon />
            </IconButton>
          </Card>
          {/* Line and + button below each block except the last */}
          {idx === blocks.length - 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box sx={{ flex: 1, height: 2, bgcolor: 'grey.300' }} />
              <IconButton color="primary" onClick={handleAddBlock} sx={{ mx: 1 }}>
                <AddIcon />
              </IconButton>
              <Box sx={{ flex: 1, height: 2, bgcolor: 'grey.300' }} />
            </Box>
          )}
        </Box>
      ))}
      {/* 3-dots menu */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleChangeBlock}>Change Block</MenuItem>
      </Menu>
      {/* Change Block Modal */}
      <Dialog open={changeModalOpen} onClose={handleChangeBlockCancel}>
        <DialogTitle>Select Block Type</DialogTitle>
        <DialogContent>
          {blockLibrary.map((b) => (
            <Button key={b.type} onClick={() => handleChangeBlockSelect(b.type, b.label)} sx={{ m: 1 }} variant="outlined">
              {b.label}
            </Button>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleChangeBlockCancel}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 