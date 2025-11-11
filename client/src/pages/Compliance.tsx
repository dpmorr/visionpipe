import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Box,
  Tab,
  Tabs,
  Grid,
  CircularProgress,
  ListItemText,
  Checkbox,
  OutlinedInput,
  Container,
} from "@mui/material";
import {
  PhotoCamera,
  Warning,
  CheckCircle,
  Cancel,
  Schedule,
  CheckBox,
  Assignment,
  TaskAlt,
  FindInPage,
  SearchOff,
} from "@mui/icons-material";
import { useToast } from "@/hooks/use-toast";

// Shared interfaces and schemas
interface ComplianceCheck {
  status: 'compliant' | 'non-compliant' | 'warning';
  regulation: string;
  details: string;
  recommendations: string[];
}

interface AutomaticComplianceAlert {
  id: string;
  timestamp: string;
  source: 'camera' | 'sensor' | 'system';
  location: string;
  type: 'warning' | 'violation' | 'compliance';
  description: string;
  status: 'active' | 'resolved';
  severity: 'low' | 'medium' | 'high';
}

type CertificationStage = 'not_started' | 'started' | 'applied' | 'in_progress' | 'approved' | 'expired';

interface CertificationProgress {
  id: number;
  certificationId: number;
  currentStage: CertificationStage;
  startedAt?: string;
  appliedAt?: string;
  inProgressAt?: string;
  approvedAt?: string;
  expiredAt?: string;
  nextSteps?: string[];
  notes?: string;
}

interface CertificationType {
  id: number;
  name: string;
  description: string;
  requirements: string[];
  validityPeriod: number;
  industry: string | string[];
  difficulty: 'Low' | 'Medium' | 'Medium-High' | 'High';
  provider: string;
  providerUrl: string;
  estimatedTime: string;
  cost: string;
  relevance: number;
}

const complianceSchema = z.object({
  wasteType: z.string().min(1, "Please select a waste type"),
  wasteDescription: z.string().min(1, "Please provide a description"),
  location: z.string().min(1, "Please select a location"),
  quantity: z.string().min(1, "Please enter a quantity"),
  storageMethod: z.string().min(1, "Please select a storage method"),
  containment: z.array(z.string()).min(1, "Please select at least one containment measure"),
  licenses: z.array(z.string()).min(1, "Please select at least one license"),
  procedures: z.array(z.string()).min(1, "Please select at least one procedure"),
  additionalNotes: z.string().optional(),
});

const filterSchema = z.object({
  industry: z.string().min(1, "Please select an industry"),
});

export default function ComplianceAndCertifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);

  // Form handling
  const complianceForm = useForm<z.infer<typeof complianceSchema>>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      wasteType: "",
      wasteDescription: "",
      location: "",
      quantity: "",
      storageMethod: "",
      containment: [],
      licenses: [],
      procedures: [],
      additionalNotes: "",
    },
  });

  const filterForm = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      industry: "All Industries",
    },
  });

  // Queries
  const { data: automaticCompliance = [], isLoading: loadingAutoCompliance } = useQuery<AutomaticComplianceAlert[]>({
    queryKey: ["/api/compliance/automatic"],
  });

  const { data: certifications = [], isLoading: loadingCerts } = useQuery<CertificationType[]>({
    queryKey: ["/api/certifications"],
  });

  const { data: certificationProgress = [], isLoading: loadingProgress } = useQuery<CertificationProgress[]>({
    queryKey: ["/api/certification-progress"],
  });

  // Mutations
  const checkCompliance = useMutation({
    mutationFn: async (values: z.infer<typeof complianceSchema>) => {
      const response = await fetch("/api/compliance/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("Failed to check compliance");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Compliance Check Complete",
        description: "Review the detailed analysis below",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/automatic"] });
    },
  });

  const startCertification = useMutation({
    mutationFn: async (certType: CertificationType) => {
      const response = await fetch("/api/certifications/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificationTypeId: certType.id }),
      });
      if (!response.ok) throw new Error("Failed to start certification process");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Process Started",
        description: "Your certification process has been initiated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certification-progress"] });
    },
  });

  const updateCertificationStage = useMutation({
    mutationFn: async ({
      progressId,
      stage,
      checked
    }: {
      progressId: number;
      stage: CertificationStage;
      checked: boolean;
    }) => {
      const response = await fetch(`/api/certification-progress/${progressId}/update-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, checked }),
      });
      if (!response.ok) throw new Error("Failed to update certification stage");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certification-progress"] });
    },
  });

  // Custom styles
  const cardStyles = {
    mb: 4,
    '& .MuiCardHeader-root': {
      pb: 0,
    },
  };

  const renderComplianceAlert = (alert: AutomaticComplianceAlert) => (
    <Card key={alert.id} sx={cardStyles}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {alert.source === "camera" && <PhotoCamera />}
            {alert.source === "sensor" && <Warning />}
            <Typography variant="subtitle1">{alert.location}</Typography>
          </Box>
          <Chip
            label={alert.type}
            color={
              alert.type === "violation" ? "error" :
                alert.type === "warning" ? "warning" :
                  "success"
            }
          />
        </Box>
        <Typography color="text.secondary" mb={2}>{alert.description}</Typography>
        <Box display="flex" gap={1}>
          <Chip
            label={`${alert.severity} severity`}
            variant="outlined"
            size="small"
          />
          <Chip
            label={alert.status}
            variant="outlined"
            size="small"
          />
        </Box>
      </CardContent>
    </Card>
  );

  const renderCertificationCard = (cert: CertificationType) => (
    <Card key={cert.id} sx={cardStyles}>
      <CardHeader
        title={cert.name}
        subheader={cert.description}
        action={
          <Chip
            label={`${cert.difficulty} Difficulty`}
            color={
              cert.difficulty === "High" ? "error" :
                cert.difficulty === "Medium-High" ? "warning" :
                  "primary"
            }
          />
        }
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>Requirements:</Typography>
            <ul style={{ paddingLeft: '20px' }}>
              {cert.requirements.map((req, idx) => (
                <li key={idx}>
                  <Typography variant="body2" color="text.secondary">{req}</Typography>
                </li>
              ))}
            </ul>
          </Box>

          <Box display="flex" flexWrap="wrap" gap={1}>
            {Array.isArray(cert.industry) ? (
              cert.industry.map((ind, idx) => (
                <Chip key={idx} label={ind} variant="outlined" size="small" />
              ))
            ) : (
              <Chip label={cert.industry} variant="outlined" size="small" />
            )}
            <Chip label={`${cert.validityPeriod} months validity`} variant="outlined" size="small" />
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Provider: {cert.provider}<br />
              Estimated Time: {cert.estimatedTime}<br />
              Cost Level: {cert.cost}
            </Typography>
          </Box>

          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="outlined"
              href={cert.providerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Provider Website
            </Button>
            <Button
              variant="contained"
              onClick={() => startCertification.mutate(cert)}
              disabled={startCertification.isPending}
            >
              Start Process
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loadingCerts || loadingProgress || loadingAutoCompliance) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          px: 3
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}
        >
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Compliance Monitor" />
            <Tab label="Self Compliance Check" />
            <Tab label="Certifications" />
            <Tab label="Certification Progress" />
          </Tabs>
        </Box>
      </Box>

      <Box sx={{ bgcolor: 'background.default' }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* Compliance Tab */}
          {tabValue === 0 && (
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title="Automatic Compliance Monitor"
                    subheader="Real-time monitoring using AI cameras, sensors, and system data"
                  />
                  <CardContent>
                    {loadingAutoCompliance ? (
                      <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                      </Box>
                    ) : automaticCompliance.length === 0 ? (
                      <Box 
                        display="flex" 
                        flexDirection="column" 
                        alignItems="center" 
                        justifyContent="center" 
                        p={6}
                        gap={2}
                      >
                        <SearchOff sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5 }} />
                        <Typography variant="h6" color="text.secondary" align="center">
                          No Compliance Alerts
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
                          The system is actively monitoring your waste management operations. 
                          When any compliance issues are detected, they will appear here.
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {automaticCompliance.map(renderComplianceAlert)}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Self Compliance Check Tab */}
          {tabValue === 1 && (
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title="Self Compliance Check"
                    subheader="Verify compliance with Australian regulations"
                  />
                  <CardContent>
                    <form onSubmit={complianceForm.handleSubmit((data) => checkCompliance.mutate(data))}>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Controller
                            name="wasteType"
                            control={complianceForm.control}
                            render={({ field, fieldState }) => (
                              <FormControl fullWidth error={!!fieldState.error}>
                                <InputLabel>Waste Type</InputLabel>
                                <Select {...field} label="Waste Type">
                                  <MenuItem value="hazardous">Hazardous Waste</MenuItem>
                                  <MenuItem value="non-hazardous">Non-Hazardous Waste</MenuItem>
                                  <MenuItem value="recyclable">Recyclable Materials</MenuItem>
                                  <MenuItem value="e-waste">E-Waste</MenuItem>
                                  <MenuItem value="clinical">Clinical/Medical Waste</MenuItem>
                                  <MenuItem value="construction">Construction & Demolition</MenuItem>
                                </Select>
                                {fieldState.error && (
                                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                                )}
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="wasteDescription"
                            control={complianceForm.control}
                            render={({ field, fieldState }) => (
                              <FormControl fullWidth error={!!fieldState.error}>
                                <InputLabel htmlFor="wasteDescription">Waste Description</InputLabel>
                                <OutlinedInput id="wasteDescription" {...field} label="Waste Description" />
                                {fieldState.error && (
                                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                                )}
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="location"
                            control={complianceForm.control}
                            render={({ field, fieldState }) => (
                              <FormControl fullWidth error={!!fieldState.error}>
                                <InputLabel htmlFor="location">Location</InputLabel>
                                <OutlinedInput id="location" {...field} label="Location" />
                                {fieldState.error && (
                                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                                )}
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="quantity"
                            control={complianceForm.control}
                            render={({ field, fieldState }) => (
                              <FormControl fullWidth error={!!fieldState.error}>
                                <InputLabel htmlFor="quantity">Quantity</InputLabel>
                                <OutlinedInput id="quantity" {...field} label="Quantity" />
                                {fieldState.error && (
                                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                                )}
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="storageMethod"
                            control={complianceForm.control}
                            render={({ field, fieldState }) => (
                              <FormControl fullWidth error={!!fieldState.error}>
                                <InputLabel htmlFor="storageMethod">Storage Method</InputLabel>
                                <OutlinedInput id="storageMethod" {...field} label="Storage Method" />
                                {fieldState.error && (
                                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                                )}
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="containment"
                            control={complianceForm.control}
                            render={({ field, fieldState }) => (
                              <FormControl fullWidth error={!!fieldState.error}>
                                <InputLabel id="containment-label">Containment Measures</InputLabel>
                                <Select
                                  labelId="containment-label"
                                  id="containment"
                                  multiple
                                  {...field}
                                  label="Containment Measures"
                                  renderValue={(selected) => selected.join(', ')}
                                >
                                  <MenuItem value="sealed_containers">Sealed Containers</MenuItem>
                                  <MenuItem value="lined_containers">Lined Containers</MenuItem>
                                  <MenuItem value="covered_bins">Covered Bins</MenuItem>
                                </Select>
                                {fieldState.error && (
                                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                                )}
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="licenses"
                            control={complianceForm.control}
                            render={({ field, fieldState }) => (
                              <FormControl fullWidth error={!!fieldState.error}>
                                <InputLabel id="licenses-label">Required Licenses</InputLabel>
                                <Select
                                  labelId="licenses-label"
                                  id="licenses"
                                  multiple
                                  {...field}
                                  label="Required Licenses"
                                  renderValue={(selected) => selected.join(', ')}
                                >
                                  <MenuItem value="epa">EPA License</MenuItem>
                                  <MenuItem value="transport">Transport License</MenuItem>
                                  <MenuItem value="storage">Storage License</MenuItem>
                                </Select>
                                {fieldState.error && (
                                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                                )}
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="procedures"
                            control={complianceForm.control}
                            render={({ field, fieldState }) => (
                              <FormControl fullWidth error={!!fieldState.error}>
                                <InputLabel id="procedures-label">Required Procedures</InputLabel>
                                <Select
                                  labelId="procedures-label"
                                  id="procedures"
                                  multiple
                                  {...field}
                                  label="Required Procedures"
                                  renderValue={(selected) => selected.join(', ')}
                                >
                                  <MenuItem value="spill_response">Spill Response Plan</MenuItem>
                                  <MenuItem value="emergency">Emergency Procedures</MenuItem>
                                  <MenuItem value="disposal">Disposal Procedures</MenuItem>
                                </Select>
                                {fieldState.error && (
                                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                                )}
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="additionalNotes"
                            control={complianceForm.control}
                            render={({ field, fieldState }) => (
                              <FormControl fullWidth error={!!fieldState.error}>
                                <InputLabel htmlFor="additionalNotes">Additional Notes</InputLabel>
                                <OutlinedInput id="additionalNotes" multiline rows={4} {...field} label="Additional Notes" />
                                {fieldState.error && (
                                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                                )}
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={checkCompliance.isPending}
                            startIcon={checkCompliance.isPending && <CircularProgress size={20} />}
                          >
                            Check Compliance
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Certifications Tab */}
          {tabValue === 2 && (
            <Card>
              <CardHeader
                title="Available Certifications"
                subheader="Browse and start the certification process"
              />
              <CardContent>
                <Controller
                  name="industry"
                  control={filterForm.control}
                  render={({ field, fieldState }) => (
                    <FormControl sx={{ mb: 4, minWidth: 280 }} error={!!fieldState.error}>
                      <InputLabel>Filter by Industry</InputLabel>
                      <Select {...field} label="Filter by Industry">
                        {["All Industries", "Manufacturing", "Construction", "Energy"].map(industry => (
                          <MenuItem key={industry} value={industry}>
                            {industry}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldState.error && (
                        <FormHelperText>{fieldState.error.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />

                <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                  {loadingCerts ? (
                    <Box display="flex" justifyContent="center" p={4}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {certifications
                        .filter(cert =>
                          filterForm.watch("industry") === "All Industries" ||
                          (Array.isArray(cert.industry)
                            ? cert.industry.includes(filterForm.watch("industry"))
                            : cert.industry === filterForm.watch("industry"))
                        )
                        .map(renderCertificationCard)}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Progress Tab */}
          {tabValue === 3 && (
            <Card>
              <CardHeader
                title="Certification Progress"
                subheader="Track your ongoing certification processes"
              />
              <CardContent>
                {loadingProgress ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : certificationProgress.length === 0 ? (
                  <Typography align="center" color="text.secondary" py={4}>
                    No certification applications in progress.
                    Start by applying for a certification from the Available Certifications tab.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {certificationProgress.map(progress => {
                      const certification = certifications.find(c => c.id === progress.certificationId);
                      if (!certification) return null;

                      return (
                        <Card key={progress.id} sx={cardStyles}>
                          <CardHeader
                            title={certification.name}
                            subheader={certification.description}
                            action={
                              <Chip
                                label={progress.currentStage.replace("_", " ").toUpperCase()}
                                color={
                                  progress.currentStage === "approved" ? "success" :
                                    progress.currentStage === "in_progress" ? "warning" :
                                      "primary"
                                }
                              />
                            }
                          />
                          <CardContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {["started", "applied", "in_progress", "approved"].map((stage) => (
                                <Box
                                  key={stage}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 2,
                                    borderRadius: 1,
                                    border: 1,
                                    borderColor: 'grey.300'
                                  }}
                                >
                                  <Checkbox
                                    checked={progress.currentStage === stage}
                                    onChange={(e) => {
                                      updateCertificationStage.mutate({
                                        progressId: progress.id,
                                        stage: stage as CertificationStage,
                                        checked: e.target.checked,
                                      });
                                    }}
                                  />
                                  <Box>
                                    <Typography variant="body1" fontWeight="medium">
                                      {stage.replace("_", " ").charAt(0).toUpperCase() + stage.slice(1)}
                                    </Typography>
                                    {progress[`${stage}At` as keyof CertificationProgress] && (
                                      <Typography variant="caption" color="text.secondary">
                                        {format(
                                          new Date(progress[`${stage}At` as keyof CertificationProgress] as string),
                                          "PPP"
                                        )}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>
    </Box>
  );
}