import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Help as HelpIcon,
  LiveHelp as LiveHelpIcon,
  Assignment as AssignmentIcon,
  PlayCircle as PlayCircleIcon,
  ContactSupport as ContactSupportIcon,
  MenuBook as BookIcon,
} from "@mui/icons-material";
import PageHeader from "@/components/PageHeader";
import DocsPage from "./Docs";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`help-tabpanel-${index}`}
      aria-labelledby={`help-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function HelpPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const guides = [
    {
      title: "Getting Started",
      items: [
        "Setting up your organization profile",
        "Adding team members",
        "Configuring sustainability goals",
        "Understanding your dashboard",
      ],
    },
    {
      title: "Waste Management",
      items: [
        "Creating waste collection points",
        "Scheduling pickups",
        "Tracking waste metrics",
        "Generating sustainability reports",
      ],
    },
    {
      title: "Vendor Management",
      items: [
        "Finding and connecting with vendors",
        "Managing vendor relationships",
        "Evaluating vendor performance",
        "Processing vendor payments",
      ],
    },
    {
      title: "Analytics & Reporting",
      items: [
        "Understanding key metrics",
        "Creating custom reports",
        "Analyzing trends",
        "Sharing insights with stakeholders",
      ],
    },
  ];

  const faqs = [
    {
      question: "How do I add a new waste collection point?",
      answer: "Navigate to the Wastepoints section, click 'Add New Point', and fill in the required details including location, waste types, and collection frequency.",
    },
    {
      question: "How can I generate sustainability reports?",
      answer: "Go to the Analytics section, select your desired metrics and date range, then click 'Generate Report'. You can export reports in various formats including PDF and Excel.",
    },
    {
      question: "How do I connect with new vendors?",
      answer: "Visit the Vendors section to browse our directory of verified sustainability partners. You can filter by service type, location, and ratings to find the perfect match for your needs.",
    },
    {
      question: "What should I do if I need technical support?",
      answer: "For technical support, click the Help icon in the bottom right corner to chat with our AI assistant, or email support@compliro.com for direct assistance.",
    },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <PageHeader
        title="Help Center"
        subtitle="Learn how to use Compliro effectively and get support when you need it"
      />

      <Paper sx={{ width: "100%", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="help center tabs"
          centered
        >
          <Tab icon={<SchoolIcon />} label="Guides" />
          <Tab icon={<LiveHelpIcon />} label="FAQs" />
          <Tab icon={<ContactSupportIcon />} label="Support" />
          <Tab icon={<BookIcon />} label="Docs" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: "grid", gap: 3 }}>
          {guides.map((section, index) => (
            <Card key={index}>
              <CardHeader title={section.title} />
              <CardContent>
                <List>
                  {section.items.map((item, itemIndex) => (
                    <ListItem key={itemIndex}>
                      <ListItemIcon>
                        <PlayCircleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          ))}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {faqs.map((faq, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Typography variant="h6">Need Help?</Typography>
              <Typography>
                Our support team is here to help you get the most out of Compliro.
                Choose your preferred way to get assistance:
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <HelpIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="AI Assistant"
                    secondary="Get instant answers to common questions through our AI chatbot"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AssignmentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Documentation"
                    secondary="Browse our detailed documentation for step-by-step guides"
                  />
                </ListItem>
              </List>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Box sx={{ bgcolor: 'grey.50', p: 0, m: 0 }}>
          <DocsPage />
        </Box>
      </TabPanel>
    </Box>
  );
}
