import { ThemeProvider } from '@mui/material/styles';
import { Box, Container, AppBar, Toolbar, CircularProgress, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { Switch, Route, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useSidebar } from "@/hooks/use-sidebar";
import { CustomizationProvider, useCustomization } from "@/contexts/customization";
import { createTheme } from "../../src/theme";
import Calculator from "@/pages/public/Calculator";
import SideNav from "@/components/SideNav";
import ProfileDropdown from "@/components/ProfileDropdown";
import AuthPage from "@/pages/AuthPage";
import LiteLayout from "@/components/LiteLayout";
import AIChatbot from "@/components/AIChatbot";
import SubscriptionPage from "@/pages/SubscriptionPage";
import HomePage from "@/pages/HomePage";
import LiteHomePage from "@/pages/LiteHomePage";
import DashboardV2 from "@/pages/DashboardV2";
import Analytics from "@/pages/Analytics";
import Compliance from "@/pages/Compliance";
import MaterialAnalysis from "@/pages/MaterialAnalysis";
import Sensors from "@/pages/Sensors";
import Integrations from "@/pages/Integrations";
import Marketplace from "@/pages/Marketplace";
import Products from "@/pages/Products";
import Suppliers from "@/pages/Suppliers";
import BusinessProcessMaker from "@/pages/BusinessProcessMaker";
import Invoicing from "@/pages/Invoicing";
import GoalSetter from "@/pages/GoalSetter";
import ReportGenerator from "@/pages/ReportGenerator";
import ProjectManagement from "@/pages/ProjectManagement";
import Training from "@/pages/TrendsAnalysis"; 
import Certifications from "@/pages/Certifications";
import VendorDashboard from "@/pages/vendor/Dashboard";
import VendorRoutes from "@/pages/vendor/Routes";
import VendorCustomers from "@/pages/vendor/Customers";
import VendorServices from "@/pages/vendor/Services";
import VendorSchedule from "@/pages/vendor/Schedule";
import VendorAnalytics from "@/pages/vendor/Analytics";
import VendorReports from "@/pages/vendor/Reports";
import VendorCompliance from "@/pages/vendor/Compliance";
import VendorInvoices from "@/pages/vendor/Invoices";
import VendorManagement from "@/pages/admin/VendorManagement";
import CertificationsManagement from "@/pages/admin/CertificationsManagement";
import ProductsManagement from "@/pages/admin/ProductsManagement";
import SensorControl from "@/pages/admin/SensorControl";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import OrganizationSettings from "@/pages/OrganizationSettings";
import BillingSettings from "@/pages/BillingSettings";
import OrganizationUsers from "@/pages/OrganizationUsers";
import PickupSchedule from "@/pages/PickupSchedule";
import Carbon from "@/pages/Carbon";
import WastePoints from "@/pages/WastePoints";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect } from "react";
import { LineChartOutlined, ReconciliationOutlined, SyncOutlined, DollarOutlined } from '@ant-design/icons';
import ProjectsAndGoals from "@/pages/ProjectsAndGoals";
import VendorDirectory from "@/pages/VendorDirectory";
import HelpPage from "@/pages/HelpPage";
import WasteCalculator from "@/pages/admin/WasteCalculator";
import LiteAuthPage from "@/pages/LiteAuthPage";
import ConnectAuthPage from "@/pages/ConnectAuthPage"; // Added import
import ConnectLayout from "@/components/ConnectLayout"; // Added import
import ConnectHomePage from "@/pages/ConnectHomePage"; // Added import
import Locations from "@/pages/Optimization";
import { LoadScript } from '@react-google-maps/api';
import { AppModeProvider } from './contexts/AppModeProvider';
import DataModels from "@/pages/DataModels";
import Alerts from "@/pages/Alerts";
import DataBuilder from "@/pages/DataBuilder";


interface SubscriptionPageProps {
  registrationData?: {
    email: string;
    password: string;
    organizationName: string;
  };
}

let stripePromise: Promise<any> | null = null;

const COLLAPSED_WIDTH = 64;
const DRAWER_WIDTH = 280;

// Add Google Maps script loading at app level
const GoogleMapsScript = () => {
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is not defined');
      return;
    }

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  return null;
};

function AppContent() {
  const { user, isLoading } = useUser();
  const { collapsed, setCollapsed } = useSidebar();
  const customization = useCustomization();
  const [location, setLocation] = useLocation();

  const theme = createTheme({
    colorPreset: customization.colorPreset,
    direction: customization.direction,
    paletteMode: customization.paletteMode,
    layout: customization.layout,
  });

  // Check if we're in Connect mode
  const isConnectPath = location.startsWith('/connect');
  const params = new URLSearchParams(window.location.search);
  const isConnectParam = params.get('type') === 'connect';
  const isConnectMode = isConnectPath || isConnectParam;

  // Store Connect mode preference in session storage
  useEffect(() => {
    if (isConnectMode) {
      sessionStorage.setItem('isConnectMode', 'true');
    } else {
      sessionStorage.removeItem('isConnectMode');
    }
  }, [isConnectMode]);

  // Handle auth state changes
  useEffect(() => {
    if (!user && !isLoading) {
      const wasConnectMode = sessionStorage.getItem('isConnectMode') === 'true';
      if (wasConnectMode) {
        setLocation('/connect');
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Handle subscription page
  const registrationData = sessionStorage.getItem('registrationData');
  const isSubscriptionPage = location === '/subscribe';

  if (isSubscriptionPage && registrationData) {
    try {
      const parsedData = JSON.parse(registrationData);
      // Check if this is a new registration or an upgrade from Connect
      if (!user || (user.userType === 'connect' && parsedData.upgradeFromConnect)) {
        if (!stripePromise) {
          stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        }
        return (
          <Elements stripe={stripePromise}>
            <SubscriptionPage registrationData={parsedData} />
          </Elements>
        );
      }
    } catch (error) {
      console.error('Failed to parse registration data:', error);
      sessionStorage.removeItem('registrationData');
      return <AuthPage />;
    }
  }

  // Handle calculator page
  if (location.startsWith('/calculator')) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', p: 3 }}>
          <Switch>
            <Route path="/calculator" component={Calculator} />
          </Switch>
        </Box>
      </ThemeProvider>
    );
  }

  // Handle unauthenticated state
  if (!user) {
    const wasConnectMode = sessionStorage.getItem('isConnectMode') === 'true';
    if (isConnectMode || wasConnectMode) {
      return <ConnectAuthPage />;
    }
    return <AuthPage />;
  }
  
  // For debugging purposes, add a temporary direct link to the SensorControl page
  console.log('User role:', user.role, 'Organization role:', user.organizationRole);
  

  // Handle Connect user
  if (user.userType === 'connect' || sessionStorage.getItem('isConnectMode') === 'true') {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ConnectLayout>
          <Switch>
            <Route path="/connect" component={ConnectHomePage} />
            <Route path="/connect/services" component={VendorDirectory} />
            <Route path="/connect/profile" component={ProfilePage} />
            <Route path="/connect/settings" component={SettingsPage} />
            <Route path="/" component={ConnectHomePage} />
          </Switch>
        </ConnectLayout>
      </ThemeProvider>
    );
  }

  const isVendor = user.role?.toLowerCase() === 'vendor';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <SideNav />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            marginLeft: 0,
            width: `calc(100% - ${collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Box 
            component="div"
            sx={{
              flexGrow: 1,
              p: 3,
              minHeight: '100vh',
              bgcolor: 'background.default'
            }}
          >
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/subscribe" component={SubscriptionPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/organization" component={OrganizationSettings} />
              <Route path="/organization/users" component={OrganizationUsers} />
              {isVendor ? (
                <>
                  <Route path="/routes" component={VendorRoutes} />
                  <Route path="/customers" component={VendorCustomers} />
                  <Route path="/services" component={VendorServices} />
                  <Route path="/schedule" component={VendorSchedule} />
                  <Route path="/analytics" component={VendorAnalytics} />
                  <Route path="/reports" component={VendorReports} />
                  <Route path="/compliance" component={VendorCompliance} />
                  <Route path="/invoices" component={VendorInvoices} />
                </>
              ) : (
                <>
                  <Route path="/analytics" component={Analytics} />
                  <Route path="/alerts" component={Alerts} />
                  <Route path="/compliance" component={Compliance} />
                  <Route path="/material-analysis" component={MaterialAnalysis} />
                  <Route path="/sensors" component={Sensors} />
                  <Route path="/integrations" component={Integrations} />
                  <Route path="/vendor-directory" component={VendorDirectory} />
                  <Route path="/products" component={Products} />
                  <Route path="/process-maker" component={BusinessProcessMaker} />
                  <Route path="/invoicing" component={Invoicing} />
                  <Route path="/projects" component={ProjectsAndGoals} />
                  <Route path="/report-generator" component={ReportGenerator} />
                  <Route path="/training" component={Training} />
                  <Route path="/certifications" component={Certifications} />
                  <Route path="/schedule" component={PickupSchedule} />
                  <Route path="/carbon" component={Carbon} />
                  <Route path="/waste-points" component={WastePoints} />
                  <Route path="/optimization" component={Locations} />
                  <Route path="/data-builder" component={DataBuilder} />
                  <Route path="/data-builder/:id" component={DataBuilder} />
                  <Route path="/help" component={HelpPage} />
                  <Route path="/data-models" component={DataModels} />
                </>
              )}
              {/* DIRECT ADMIN ROUTE - Access without permission checks for testing */}
              <Route path="/admin/sensor-control" component={SensorControl} />

              {/* Admin routes - with permission checks */}
              {user?.organizationRole?.toLowerCase() === 'owner' && (
                <>
                  <Route path="/admin/vendors" component={VendorManagement} />
                  <Route path="/admin/certifications" component={CertificationsManagement} />
                  <Route path="/admin/products" component={ProductsManagement} />
                  <Route path="/admin/waste-calculator" component={WasteCalculator} />
                </>
              )}
            </Switch>
          </Box>
        </Box>
      </Box>
      {user.role?.toLowerCase() === 'user' && <AIChatbot />}
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AppModeProvider>
      <GoogleMapsScript />
      <CustomizationProvider>
        <AppContent />
      </CustomizationProvider>
    </AppModeProvider>
  );
}