import { Box, styled } from '@mui/material';
import { Header } from '../ui/header';
import { Sidebar } from '../ui/sidebar';

const DRAWER_WIDTH = 280;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${DRAWER_WIDTH}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
  '& .MuiToolbar-root': {
    width: '100%',
    paddingLeft: 0,
    '&.MuiToolbar-gutters': {
      paddingLeft: 0,
      paddingRight: theme.spacing(2),
    },
  },
}));

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header />
      <Sidebar />
      <Main open>
        <DrawerHeader />
        {children}
      </Main>
    </Box>
  );
}