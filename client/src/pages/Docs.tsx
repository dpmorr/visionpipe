import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Container,
  AppBar,
  Toolbar,
  Drawer,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SensorsIcon from '@mui/icons-material/Sensors';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import GroupIcon from '@mui/icons-material/Group';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SettingsIcon from '@mui/icons-material/Settings';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';

const sections = [
  { id: 'overview', label: 'Platform Overview', icon: InfoIcon },
  { id: 'dashboard', label: 'Dashboard & Navigation', icon: DashboardIcon },
  { id: 'sensors', label: 'Sensors & Device Management', icon: SensorsIcon },
  { id: 'waste-points', label: 'Waste Points', icon: DeleteIcon },
  { id: 'scheduling', label: 'Scheduling & Pickups', icon: CalendarMonthIcon },
  { id: 'analytics', label: 'Analytics & Reports', icon: AssessmentIcon },
  { id: 'ai', label: 'AI Insights & Chatbot', icon: SmartToyIcon },
  { id: 'certifications', label: 'Certifications & Compliance', icon: VerifiedUserIcon },
  { id: 'billing', label: 'Billing & Subscription', icon: CreditCardIcon },
  { id: 'organization', label: 'Organization & User Management', icon: GroupIcon },
  { id: 'api-tokens', label: 'API Tokens & Integrations', icon: VpnKeyIcon },
  { id: 'settings', label: 'Settings & Customization', icon: SettingsIcon },
  { id: 'faq', label: 'FAQ & Support', icon: IntegrationInstructionsIcon },
];

const sectionContent: Record<string, JSX.Element> = {
  overview: (
    <Box>
      <Typography variant="h4" gutterBottom>Welcome to the Wastetraq Platform</Typography>
      <Typography variant="body1" paragraph>
        Wastetraq is a comprehensive waste management platform that leverages IoT sensors, AI, and analytics to help organizations optimize waste collection, track sustainability goals, and streamline compliance. This documentation provides a detailed guide to every feature, from device management to advanced analytics and API integrations.
      </Typography>
      <Typography variant="h6" sx={{ mt: 3 }}>Who Should Use This Platform?</Typography>
      <Typography variant="body2" paragraph>
        Wastetraq is designed for sustainability managers, operations teams, facility managers, compliance officers, and anyone responsible for waste management and reporting in an organization.
      </Typography>
      <Typography variant="h6" sx={{ mt: 3 }}>How to Use This Documentation</Typography>
      <Typography variant="body2" paragraph>
        Use the sidebar to navigate to detailed guides for each feature. Each section includes step-by-step instructions, best practices, and troubleshooting tips.
      </Typography>
    </Box>
  ),
  dashboard: (
    <Box>
      <Typography variant="h5" gutterBottom>Dashboard & Navigation</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>What is the Dashboard?</Typography>
      <Typography paragraph>
        The dashboard is your command center, providing a real-time overview of key metrics, recent activity, and quick access to all modules. It is the first page you see after logging in.
      </Typography>
      <Typography variant="subtitle1">Who Uses It?</Typography>
      <Typography paragraph>All users.</Typography>
      <Typography variant="subtitle1">Key Concepts</Typography>
      <ul>
        <li><b>Sidebar:</b> Main navigation for all modules.</li>
        <li><b>Widgets:</b> Real-time metrics and charts.</li>
        <li><b>Notifications:</b> Alerts and reminders.</li>
      </ul>
      <Typography variant="subtitle1">How to Use</Typography>
      <ol>
        <li>Use the sidebar to switch between modules (Sensors, Waste Points, Analytics, etc.).</li>
        <li>Customize your sidebar in <b>Settings &gt; Navigation Modules</b>.</li>
        <li>Review widgets for up-to-date metrics and alerts.</li>
      </ol>
      <Typography variant="subtitle1">Tips & Best Practices</Typography>
      <ul>
        <li>Pin your most-used modules for quick access.</li>
        <li>Check notifications regularly for important updates.</li>
      </ul>
      <Typography variant="subtitle1">Troubleshooting</Typography>
      <ul>
        <li>If the sidebar doesn’t update, try refreshing the page.</li>
      </ul>
    </Box>
  ),
  sensors: (
    <Box>
      <Typography variant="h5" gutterBottom>Sensors & Device Management</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Overview</Typography>
      <Typography paragraph>
        Manage all IoT sensors and devices. Add new devices, view real-time sensor data (fill levels, detected items, environmental data), and configure device settings. Each device can be linked to a waste point for granular tracking.
      </Typography>
      <Typography variant="subtitle1">Who Uses It?</Typography>
      <Typography paragraph>Admins, facility managers.</Typography>
      <Typography variant="subtitle1">Key Concepts</Typography>
      <ul>
        <li><b>Device:</b> A physical sensor installed on a bin or waste point.</li>
        <li><b>Fill Level:</b> The percentage of bin capacity used.</li>
        <li><b>Contents:</b> Items detected by computer vision.</li>
      </ul>
      <Typography variant="subtitle1">How to Use</Typography>
      <ol>
        <li>Go to the <b>Sensors</b> page from the sidebar.</li>
        <li>Click <b>Add Device</b> to register a new sensor.</li>
        <li>Fill in device details (name, location, type, etc.).</li>
        <li>Link the device to a waste point for tracking.</li>
        <li>Click on a device to view detailed data and history.</li>
        <li>Edit or remove devices as needed.</li>
      </ol>
      <Typography variant="subtitle1">Tips & Best Practices</Typography>
      <ul>
        <li>Name devices clearly by location (e.g., "Main Lobby Bin").</li>
        <li>Regularly check device status and battery levels.</li>
      </ul>
      <Typography variant="subtitle1">Troubleshooting</Typography>
      <ul>
        <li>Device not reporting? Check battery and network connection.</li>
        <li>Try rebooting the device from the device menu.</li>
      </ul>
    </Box>
  ),
  'waste-points': (
    <Box>
      <Typography variant="h5" gutterBottom>Waste Points</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Overview</Typography>
      <Typography paragraph>
        Waste Points represent physical locations (bins, dumpsters, etc.) where waste is collected. You can define process steps, assign vendors, and link devices to each waste point for automated monitoring.
      </Typography>
      <Typography variant="subtitle1">Who Uses It?</Typography>
      <Typography paragraph>Admins, operations managers.</Typography>
      <Typography variant="subtitle1">Key Concepts</Typography>
      <ul>
        <li><b>Process Step:</b> The stage in the waste workflow (e.g., collection, sorting).</li>
        <li><b>Vendor:</b> The service provider responsible for collection.</li>
        <li><b>Device Link:</b> Connect a sensor to a waste point for automated data.</li>
      </ul>
      <Typography variant="subtitle1">How to Use</Typography>
      <ol>
        <li>Navigate to <b>Waste Points</b> from the sidebar.</li>
        <li>Click <b>Add Waste Point</b> to create a new location.</li>
        <li>Fill in details (name, process step, vendor, etc.).</li>
        <li>Link a device for automated monitoring.</li>
        <li>View collection history and fill levels.</li>
      </ol>
      <Typography variant="subtitle1">Tips & Best Practices</Typography>
      <ul>
        <li>Use descriptive names for easy tracking.</li>
        <li>Assign vendors to automate scheduling.</li>
      </ul>
      <Typography variant="subtitle1">Troubleshooting</Typography>
      <ul>
        <li>Missing data? Check device link and vendor assignment.</li>
      </ul>
    </Box>
  ),
  scheduling: (
    <Box>
      <Typography variant="h5" gutterBottom>Scheduling & Pickups</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Overview</Typography>
      <Typography paragraph>
        Automate and manage waste collection schedules. Create recurring pickups, assign vendors, and track completion. The system can send reminders and optimize routes based on fill levels and historical data.
      </Typography>
      <Typography variant="subtitle1">Who Uses It?</Typography>
      <Typography paragraph>Operations managers, vendors.</Typography>
      <Typography variant="subtitle1">Key Concepts</Typography>
      <ul>
        <li><b>Schedule:</b> A planned pickup event.</li>
        <li><b>Pickup:</b> The actual collection of waste.</li>
        <li><b>Frequency:</b> How often pickups occur (daily, weekly, etc.).</li>
      </ul>
      <Typography variant="subtitle1">How to Use</Typography>
      <ol>
        <li>Go to the <b>Scheduling</b> page.</li>
        <li>Click <b>Create Schedule</b> to add a new pickup plan.</li>
        <li>Select waste points, vendors, and frequency.</li>
        <li>Monitor upcoming and completed pickups.</li>
        <li>Edit or cancel schedules as needed.</li>
      </ol>
      <Typography variant="subtitle1">Tips & Best Practices</Typography>
      <ul>
        <li>Set reminders for critical pickups.</li>
        <li>Review missed pickups in analytics.</li>
      </ul>
      <Typography variant="subtitle1">Troubleshooting</Typography>
      <ul>
        <li>Pickup not marked complete? Check vendor status and device data.</li>
      </ul>
    </Box>
  ),
  analytics: (
    <Box>
      <Typography variant="h5" gutterBottom>Analytics & Reports</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Overview</Typography>
      <Typography paragraph>
        Access powerful analytics and reporting tools. Visualize trends, track sustainability KPIs, and export custom reports. Use the Analytics Builder to create custom dashboards and share insights with your team.
      </Typography>
      <Typography variant="subtitle1">Who Uses It?</Typography>
      <Typography paragraph>Sustainability leads, executives.</Typography>
      <Typography variant="subtitle1">Key Concepts</Typography>
      <ul>
        <li><b>Dashboard:</b> Visual overview of key metrics.</li>
        <li><b>Report:</b> Exportable summary of data.</li>
        <li><b>KPI:</b> Key Performance Indicator (e.g., recycling rate).</li>
      </ul>
      <Typography variant="subtitle1">How to Use</Typography>
      <ol>
        <li>Go to the <b>Analytics</b> page.</li>
        <li>Use filters to select timeframes and metrics.</li>
        <li>View charts and tables for trends and performance.</li>
        <li>Click <b>Export</b> to download reports (PDF, CSV).</li>
        <li>Use the Analytics Builder for custom dashboards.</li>
      </ol>
      <Typography variant="subtitle1">Tips & Best Practices</Typography>
      <ul>
        <li>Use filters for targeted insights.</li>
        <li>Share reports with stakeholders regularly.</li>
      </ul>
      <Typography variant="subtitle1">Troubleshooting</Typography>
      <ul>
        <li>Missing data? Check device status and data upload times.</li>
      </ul>
    </Box>
  ),
  ai: (
    <Box>
      <Typography variant="h5" gutterBottom>AI Insights & Chatbot</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Overview</Typography>
      <Typography paragraph>
        Leverage AI-powered insights and a built-in chatbot for recommendations, anomaly detection, and Q&A. The AI Advisor can help interpret analytics, suggest optimizations, and answer platform questions.
      </Typography>
      <Typography variant="subtitle1">Who Uses It?</Typography>
      <Typography paragraph>All users.</Typography>
      <Typography variant="subtitle1">Key Concepts</Typography>
      <ul>
        <li><b>AI Advisor:</b> Provides recommendations and answers.</li>
        <li><b>Insights:</b> AI-generated suggestions and anomaly detection.</li>
      </ul>
      <Typography variant="subtitle1">How to Use</Typography>
      <ol>
        <li>Access the <b>AI Advisor</b> or <b>Chatbot</b> from the dashboard or sidebar.</li>
        <li>Type your question or select a suggested prompt.</li>
        <li>Review AI-generated insights in the Analytics section.</li>
      </ol>
      <Typography variant="subtitle1">Tips & Best Practices</Typography>
      <ul>
        <li>Phrase questions clearly for best results.</li>
        <li>Use AI suggestions to optimize operations.</li>
      </ul>
      <Typography variant="subtitle1">Troubleshooting</Typography>
      <ul>
        <li>Not getting useful answers? Try rephrasing your question.</li>
      </ul>
    </Box>
  ),
  certifications: (
    <Box>
      <Typography variant="h5" gutterBottom>Certifications & Compliance</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Overview</Typography>
      <Typography paragraph>
        Track and manage certifications, compliance documents, and regulatory requirements. Upload certificates, set renewal reminders, and assign compliance tasks to team members.
      </Typography>
      <Typography variant="subtitle1">Who Uses It?</Typography>
      <Typography paragraph>Compliance officers, admins.</Typography>
      <Typography variant="subtitle1">Key Concepts</Typography>
      <ul>
        <li><b>Certification:</b> Document proving compliance.</li>
        <li><b>Renewal:</b> Expiration and renewal tracking.</li>
        <li><b>Audit:</b> Review of compliance status.</li>
      </ul>
      <Typography variant="subtitle1">How to Use</Typography>
      <ol>
        <li>Go to <b>Certifications</b> in the sidebar.</li>
        <li>Click <b>Upload</b> to add a new document.</li>
        <li>Set reminders for renewals and audits.</li>
        <li>Assign compliance tasks to team members.</li>
      </ol>
      <Typography variant="subtitle1">Tips & Best Practices</Typography>
      <ul>
        <li>Keep all documents up to date.</li>
        <li>Set reminders well before expiration dates.</li>
      </ul>
      <Typography variant="subtitle1">Troubleshooting</Typography>
      <ul>
        <li>Missing reminders? Check notification settings.</li>
      </ul>
    </Box>
  ),
  billing: (
    <Box>
      <Typography variant="h5" gutterBottom>Billing & Subscription</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Overview</Typography>
      <Typography paragraph>
        Manage your subscription plan, payment methods, and invoices. Upgrade or downgrade your plan, add payment methods, and download past invoices from the Billing section.
      </Typography>
      <Typography variant="subtitle1">Who Uses It?</Typography>
      <Typography paragraph>Admins, finance team.</Typography>
      <Typography variant="subtitle1">Key Concepts</Typography>
      <ul>
        <li><b>Plan:</b> Your current subscription level.</li>
        <li><b>Invoice:</b> Record of payment for services.</li>
        <li><b>Payment Method:</b> Credit card or other payment source.</li>
      </ul>
      <Typography variant="subtitle1">How to Use</Typography>
      <ol>
        <li>Go to <b>Billing</b> in the sidebar.</li>
        <li>View your current plan and status.</li>
        <li>Add or update payment methods.</li>
        <li>Download invoices for your records.</li>
      </ol>
      <Typography variant="subtitle1">Tips & Best Practices</Typography>
      <ul>
        <li>Keep payment methods up to date to avoid service interruptions.</li>
        <li>Download invoices monthly for accounting.</li>
      </ul>
      <Typography variant="subtitle1">Troubleshooting</Typography>
      <ul>
        <li>Payment failed? Check card details and available funds.</li>
      </ul>
    </Box>
  ),
  organization: (
    <Box>
      <Typography variant="h5" gutterBottom>Organization & User Management</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Overview</Typography>
      <Typography paragraph>
        Manage your organization’s details, invite new users, and assign roles. Control access, view user activity, and set up your organization profile.
      </Typography>
      <Typography variant="subtitle1">Who Uses It?</Typography>
      <Typography paragraph>Admins.</Typography>
      <Typography variant="subtitle1">Key Concepts</Typography>
      <ul>
        <li><b>User:</b> A person with access to the platform.</li>
        <li><b>Role:</b> Permissions level (admin, member, etc.).</li>
        <li><b>Invite:</b> Send an email invitation to join.</li>
      </ul>
      <Typography variant="subtitle1">How to Use</Typography>
      <ol>
        <li>Go to <b>Organization</b> in the sidebar.</li>
        <li>Edit organization info (name, address, etc.).</li>
        <li>Invite new users by email.</li>
        <li>Assign roles and manage permissions.</li>
      </ol>
      <Typography variant="subtitle1">Tips & Best Practices</Typography>
      <ul>
        <li>Assign at least one backup admin.</li>
        <li>Review user access regularly.</li>
      </ul>
      <Typography variant="subtitle1">Troubleshooting</Typography>
      <ul>
        <li>User not receiving invite? Ask them to check spam/junk folder.</li>
      </ul>
    </Box>
  ),
  'api-tokens': (
    <Box>
      <Typography variant="h5" gutterBottom>API Tokens & Integrations</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Overview</Typography>
      <Typography paragraph>
        Generate API tokens for programmatic access to the platform. Integrate with third-party systems using our REST API. See the API Tokens section in Settings and the Swagger UI for full API documentation.
      </Typography>
      <Typography variant="subtitle1">Who Uses It?</Typography>
      <Typography paragraph>Developers, IT staff.</Typography>
      <Typography variant="subtitle1">Key Concepts</Typography>
      <ul>
        <li><b>API Token:</b> Secure key for authenticating API requests.</li>
        <li><b>Permissions:</b> Scopes for what the token can access.</li>
        <li><b>Swagger UI:</b> Interactive API documentation at <a href="/api/docs" target="_blank" rel="noopener noreferrer">/api/docs</a>.</li>
      </ul>
      <Typography variant="subtitle1">How to Use</Typography>
      <ol>
        <li>Go to <b>Settings &gt; API Tokens</b>.</li>
        <li>Click <b>Generate Token</b> and set permissions.</li>
        <li>Copy the token and use it in API requests (Authorization: Bearer ...).</li>
        <li>Revoke tokens if compromised or no longer needed.</li>
        <li>Visit <a href="/api/docs" target="_blank" rel="noopener noreferrer">/api/docs</a> for API reference.</li>
      </ol>
      <Typography variant="subtitle1">Tips & Best Practices</Typography>
      <ul>
        <li>Never share tokens publicly.</li>
        <li>Use separate tokens for different integrations.</li>
      </ul>
      <Typography variant="subtitle1">Troubleshooting</Typography>
      <ul>
        <li>API call failing? Check token validity and permissions.</li>
      </ul>
    </Box>
  ),
  settings: (
    <Box>
      <Typography variant="h5" gutterBottom>Settings & Customization</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Overview</Typography>
      <Typography paragraph>
        Customize your experience: notification preferences, measurement units, navigation modules, and more. Settings are available for both users and organizations.
      </Typography>
      <Typography variant="subtitle1">Who Uses It?</Typography>
      <Typography paragraph>All users.</Typography>
      <Typography variant="subtitle1">Key Concepts</Typography>
      <ul>
        <li><b>Preferences:</b> User-specific settings (notifications, privacy).</li>
        <li><b>Modules:</b> Control which pages appear in your sidebar.</li>
        <li><b>Units:</b> Choose between metric and imperial measurements.</li>
      </ul>
      <Typography variant="subtitle1">How to Use</Typography>
      <ol>
        <li>Go to <b>Settings</b> in the sidebar.</li>
        <li>Adjust notification, privacy, and sustainability preferences.</li>
        <li>Customize navigation modules and integrations.</li>
        <li>Set measurement units for your organization.</li>
      </ol>
      <Typography variant="subtitle1">Tips & Best Practices</Typography>
      <ul>
        <li>Review settings after major updates.</li>
        <li>Set up reminders for sustainability goals.</li>
      </ul>
      <Typography variant="subtitle1">Troubleshooting</Typography>
      <ul>
        <li>Settings not saving? Check your internet connection and try again.</li>
      </ul>
    </Box>
  ),
  faq: (
    <Box>
      <Typography variant="h5" gutterBottom>FAQ & Support</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Overview</Typography>
      <Typography paragraph>
        <b>Need help?</b> Here are answers to common questions. For further support, contact your administrator or email <a href="mailto:support@wastetraq.com">support@wastetraq.com</a>.
      </Typography>
      <Typography variant="subtitle1">How to Use</Typography>
      <ol>
        <li>Use the Help Center tab for guides and FAQs.</li>
        <li>Contact support for technical issues.</li>
      </ol>
      <Typography variant="subtitle1">Frequently Asked Questions</Typography>
      <ul>
        <li><b>How do I reset my password?</b> Go to Profile &gt; Change Password.</li>
        <li><b>How do I add a new device?</b> Go to Sensors &gt; Add Device.</li>
        <li><b>How do I export a report?</b> Go to Analytics &gt; Export Report.</li>
        <li><b>Where can I find API documentation?</b> Visit <a href="/api/docs" target="_blank" rel="noopener noreferrer">/api/docs</a>.</li>
      </ul>
    </Box>
  ),
};

export default function DocsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeSection, setActiveSection] = useState('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSectionClick = (id: string) => {
    setActiveSection(id);
    if (isMobile) setDrawerOpen(false);
    // Scroll to top of content on section change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const drawer = (
    <Box sx={{ width: 260, pt: 2 }}>
      <Typography variant="h6" sx={{ px: 2, mb: 2 }}>
        Docs Navigation
      </Typography>
      <Divider />
      <List>
        {sections.map(({ id, label, icon: Icon }) => (
          <ListItemButton
            key={id}
            selected={activeSection === id}
            onClick={() => handleSectionClick(id)}
          >
            <Icon sx={{ mr: 2 }} />
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Box sx={{ width: 260, flexShrink: 0, bgcolor: 'white', borderRight: 1, borderColor: 'grey.200', minHeight: '100vh' }}>
          {drawer}
        </Box>
      )}
      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 6 }, maxWidth: 900, mx: 'auto' }}>
        <AppBar position="static" color="default" elevation={0} sx={{ mb: 4 }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6">Wastetraq Platform Documentation</Typography>
            {isMobile && (
              <Button onClick={() => setDrawerOpen(true)} variant="outlined" size="small">
                Menu
              </Button>
            )}
          </Toolbar>
        </AppBar>
        <Paper sx={{ p: { xs: 2, md: 4 }, minHeight: 400 }}>
          {sectionContent[activeSection]}
        </Paper>
      </Box>
    </Box>
  );
} 