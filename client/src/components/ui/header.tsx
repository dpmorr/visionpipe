import { Box, AppBar, Toolbar, styled, useTheme } from '@mui/material';
import ProfileDropdown from '../ProfileDropdown';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[0],
  position: 'fixed',
  width: '100%',
  zIndex: theme.zIndex.drawer + 1,
}));

const StyledToolbar = styled(Toolbar)({
  display: 'flex',
  justifyContent: 'flex-end',
  width: '100%',
});

export function Header() {
  const theme = useTheme();

  return (
    <StyledAppBar elevation={0}>
      <StyledToolbar>
        <Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
          <ProfileDropdown />
        </Box>
      </StyledToolbar>
    </StyledAppBar>
  );
}