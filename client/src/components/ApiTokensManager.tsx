import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  AlertTitle,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Key as KeyIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

interface ApiToken {
  id: number;
  name: string;
  token: string;
  permissions: string[];
  lastUsed?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

interface CreateTokenData {
  name: string;
  permissions: string[];
  expiresAt?: string;
}

const availablePermissions = [
  'read:metrics',
  'write:metrics',
  'read:devices',
  'write:devices',
  'read:organizations',
  'write:organizations',
  'read:users',
  'write:users',
  'read:reports',
  'write:reports',
  'read:analytics',
  'write:analytics',
];

export function ApiTokensManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [showNewToken, setShowNewToken] = useState(false);
  const [newToken, setNewToken] = useState<ApiToken | null>(null);
  const [formData, setFormData] = useState<CreateTokenData>({
    name: '',
    permissions: [],
    expiresAt: '',
  });

  // Fetch API tokens
  const { data: tokens = [], isLoading } = useQuery<ApiToken[]>({
    queryKey: ['/api/api-tokens'],
    queryFn: async () => {
      const response = await fetch('/api/api-tokens');
      if (!response.ok) throw new Error('Failed to fetch API tokens');
      return response.json();
    },
  });

  // Create token mutation
  const createTokenMutation = useMutation({
    mutationFn: async (data: CreateTokenData) => {
      const response = await fetch('/api/api-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create API token');
      return response.json();
    },
    onSuccess: (data) => {
      setNewToken(data);
      setShowNewToken(true);
      setOpenCreateDialog(false);
      setFormData({ name: '', permissions: [], expiresAt: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/api-tokens'] });
      toast({
        title: 'API Token Created',
        description: 'Your new API token has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create API token',
      });
    },
  });

  // Revoke token mutation
  const revokeTokenMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      const response = await fetch(`/api/api-tokens/${tokenId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to revoke API token');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-tokens'] });
      toast({
        title: 'Token Revoked',
        description: 'The API token has been revoked successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to revoke API token',
      });
    },
  });

  const handleCreateToken = () => {
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Token name is required',
      });
      return;
    }
    createTokenMutation.mutate(formData);
  };

  const handleRevokeToken = (tokenId: number) => {
    if (confirm('Are you sure you want to revoke this API token? This action cannot be undone.')) {
      revokeTokenMutation.mutate(tokenId);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'API token copied to clipboard',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isTokenExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            API Tokens
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate API tokens to access the Wastetraq API programmatically
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Generate Token
        </Button>
      </Box>

      {/* New Token Display */}
      {showNewToken && newToken && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <AlertTitle>New API Token Created</AlertTitle>
          <Typography component="div">
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                {newToken.token}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                ⚠️ Copy this token now. You won't be able to see it again.
              </Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CopyIcon />}
                onClick={() => copyToClipboard(newToken.token)}
              >
                Copy Token
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={() => setShowNewToken(false)}
              >
                Dismiss
              </Button>
            </Box>
          </Typography>
        </Alert>
      )}

      {/* API Documentation Link */}
      <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          📚 API Documentation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Use these tokens with the Authorization header: <code>Authorization: Bearer YOUR_TOKEN</code>
        </Typography>
        <Button
          size="small"
          variant="outlined"
          href="/api/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          View API Documentation
        </Button>
      </Paper>

      {/* Tokens List */}
      <Paper>
        {isLoading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography>Loading tokens...</Typography>
          </Box>
        ) : tokens.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <KeyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No API Tokens
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Generate your first API token to start integrating with the Wastetraq API
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
            >
              Generate Your First Token
            </Button>
          </Box>
        ) : (
          <List>
            {tokens.map((token, index) => (
              <Box key={token.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">{token.name}</Typography>
                        {isTokenExpired(token.expiresAt) && (
                          <Chip
                            label="Expired"
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        )}
                        {!token.isActive && (
                          <Chip
                            label="Revoked"
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {token.token}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          {token.permissions.map((permission) => (
                            <Chip
                              key={permission}
                              label={permission}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Created: {formatDate(token.createdAt)}
                          {token.lastUsed && ` • Last used: ${formatDate(token.lastUsed)}`}
                          {token.expiresAt && ` • Expires: ${formatDate(token.expiresAt)}`}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(token.token)}
                        title="Copy token"
                      >
                        <CopyIcon />
                      </IconButton>
                      {token.isActive && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRevokeToken(token.id)}
                          title="Revoke token"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < tokens.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Paper>

      {/* Create Token Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate New API Token</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Token Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Production API, Development Testing"
              helperText="Give your token a descriptive name to remember its purpose"
            />

            <FormControl fullWidth>
              <InputLabel>Permissions</InputLabel>
              <Select
                multiple
                value={formData.permissions}
                onChange={(e) => setFormData({ ...formData, permissions: e.target.value as string[] })}
                input={<OutlinedInput label="Permissions" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {availablePermissions.map((permission) => (
                  <MenuItem key={permission} value={permission}>
                    <Checkbox checked={formData.permissions.indexOf(permission) > -1} />
                    <ListItemText primary={permission} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Expiration Date (Optional)"
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty for no expiration"
            />

                         <Alert severity="warning">
               <AlertTitle>Security Notice</AlertTitle>
               <Typography component="div">
                 API tokens have full access to your account data. Keep them secure and never share them publicly.
                 You can revoke tokens at any time from this page.
               </Typography>
             </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateToken}
            variant="contained"
            disabled={createTokenMutation.isPending}
          >
            {createTokenMutation.isPending ? 'Creating...' : 'Generate Token'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 