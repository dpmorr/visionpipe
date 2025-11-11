import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CustomizationProvider, useCustomization } from '@/contexts/customization';
import { createTheme } from '@/theme';

function AppContent() {
  const { settings } = useCustomization();
  const theme = createTheme(settings);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Rest of your app content */}
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <CustomizationProvider>
      <AppContent />
    </CustomizationProvider>
  );
}
