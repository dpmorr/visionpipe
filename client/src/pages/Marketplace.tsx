import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Avatar,
  Paper,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CameraAlt,
  BatteryChargingFull,
  Sensors,
  Wifi,
  Bluetooth,
  CellTower,
  Thermostat,
  Speed,
  SdStorage,
  Usb,
  GpsFixed,
  ShoppingCart,
  Info,
  CheckCircle,
  RadioButtonChecked,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/hooks/use-toast';

interface ProductSpec {
  label: string;
  value: string;
}

interface Product {
  id: string;
  name: string;
  subtitle: string;
  model: string;
  batteryLife: string;
  batteryCapacity: string;
  description: string;
  highlights: string[];
  keySpecs: ProductSpec[];
  sensorSpecs: ProductSpec[];
  connectivitySpecs: ProductSpec[];
  powerSpecs: ProductSpec[];
  physicalSpecs: ProductSpec[];
  applications: string[];
}

const products: Product[] = [
  {
    id: 'cc-standard',
    name: 'Compact Camera',
    subtitle: 'Standard Battery',
    model: 'CC-PCB-SPEC-001',
    batteryLife: '6-12+ months',
    batteryCapacity: '3,000 mAh',
    description: 'Battery-powered remote monitoring unit for waste and environmental applications. Captures images on demand or via motion detection, transmits data over cellular (NB-IoT/Cat-M), and enters ultra-low-power sleep between cycles. Ideal for standard deployment scenarios with regular access for maintenance.',
    highlights: [
      'ESP32-S3 dual-core processor, 240 MHz',
      '2 MP camera (1600x1200) with JPEG output',
      'Up to 3 Time-of-Flight distance sensors (2-8m range)',
      'Microwave Doppler radar motion detection (5-9m, through-wall)',
      'NB-IoT & Cat-M cellular with built-in GNSS',
      'WiFi 802.11 b/g/n + Bluetooth 5.0 BLE',
      'HDC1080 temperature & humidity sensor',
      '35 nA sleep current - effectively zero standby drain',
      'USB Type-C power + data interface',
      'MicroSD card slot for local storage (up to 32 GB)',
    ],
    keySpecs: [
      { label: 'Processor', value: 'ESP32-S3 - dual-core, 240 MHz, WiFi and Bluetooth 5' },
      { label: 'Camera', value: '2 Megapixel (1600 x 1200), JPEG output, up to 30 fps' },
      { label: 'Distance Sensing', value: 'Up to 3 ToF sensors (2-8 m range, mm accuracy)' },
      { label: 'Motion Detection', value: 'Microwave Doppler radar, 5-9 m range, through-wall' },
      { label: 'Temperature & Humidity', value: 'HDC1080 - +/-0.2 C, +/-2% RH' },
      { label: 'Sleep Current', value: '35 nA - effectively zero standby drain' },
      { label: 'On-board Storage', value: '64 Mbit flash + MicroSD card slot' },
      { label: 'Data Interface', value: 'USB Type-C (power + data)' },
    ],
    sensorSpecs: [
      { label: 'Camera Sensor', value: 'OmniVision OV2640' },
      { label: 'Resolution', value: '2 MP - 1600 x 1200 (UXGA)' },
      { label: 'Output Format', value: 'JPEG (hardware-encoded), YUV, RGB' },
      { label: 'Frame Rate', value: 'Up to 15 fps full res, 30 fps at SVGA' },
      { label: 'Field of View', value: '~65 degrees (lens-dependent)' },
      { label: 'ToF Sensors', value: 'VL53L0X (2m), VL53L1 (8m), VL53L4ED (6m, multizone)' },
      { label: 'ToF Accuracy', value: '+/- 3% across all models' },
      { label: 'Radar Technology', value: 'RCWL-0516 Microwave Doppler' },
      { label: 'Radar Range', value: '5-9 m adjustable, 360 degree omnidirectional' },
      { label: 'Through-Wall', value: 'Yes - non-metallic walls, wood, and glass' },
      { label: 'Temp/Humidity Sensor', value: 'Texas Instruments HDC1080DMBR' },
      { label: 'Temp Range', value: '-40 C to +125 C, +/-0.2 C accuracy' },
      { label: 'Humidity Range', value: '0% to 100% RH, +/-2% accuracy' },
    ],
    connectivitySpecs: [
      { label: 'Cellular Module', value: 'SIMCom SIM7080G' },
      { label: 'Standards', value: 'LTE Cat-NB2 (NB-IoT) and LTE Cat-M1' },
      { label: 'Upload Speed', value: 'Up to 127 kbps (NB-IoT) / 589 kbps (Cat-M)' },
      { label: 'GNSS', value: 'GPS, GLONASS, BeiDou, Galileo - built-in' },
      { label: 'SIM Type', value: 'Nano SIM (4FF)' },
      { label: 'Antenna', value: 'External SMA connector (50 ohm, DC-6 GHz)' },
      { label: 'Protocols', value: 'TCP/IP, UDP, HTTP(S), MQTT(S), CoAP, LwM2M' },
      { label: 'WiFi Standard', value: 'IEEE 802.11 b/g/n (2.4 GHz), 150 Mbps' },
      { label: 'WiFi Range', value: '100-400 m line of sight' },
      { label: 'WiFi Security', value: 'WPA / WPA2 / WPA3-Personal' },
      { label: 'Bluetooth', value: 'Bluetooth 5.0 (Low Energy), 30-100 m range' },
    ],
    powerSpecs: [
      { label: 'Deep Sleep', value: '35 nA (timer only)' },
      { label: 'Sensor Reading', value: '55 mA typical, 70 mA peak' },
      { label: 'Image Capture', value: '120 mA typical, 160 mA peak' },
      { label: 'Cellular (NB-IoT)', value: '180 mA typical, 350 mA peak' },
      { label: 'Cellular (Cat-M)', value: '200 mA typical, 490 mA peak' },
      { label: 'WiFi Transmit', value: '240 mA typical, 340 mA peak' },
      { label: 'Typical Full Cycle', value: '180 mA average, ~10 s total' },
      { label: 'Power Input', value: 'USB 5V or 3.7V Li-ion (2.5-4.35V range)' },
    ],
    physicalSpecs: [
      { label: 'Board Format', value: 'A4-class PCB, 2-layer standard FR-4' },
      { label: 'Mounting', value: '2 x M3 screw holes for enclosure integration' },
      { label: 'Connectors', value: 'USB-C, SMA, Nano SIM, MicroSD, 3.5mm audio, battery header' },
      { label: 'Status Indicators', value: '2 x addressable RGB LEDs' },
      { label: 'User Controls', value: '3 x tactile buttons (function, reset, boot)' },
      { label: 'Operating Temp', value: '-40 C to +85 C' },
      { label: 'Storage Temp', value: '-40 C to +125 C' },
      { label: 'ESD Tolerance', value: '+/- 2 kV (Human Body Model)' },
    ],
    applications: [
      'Bin Fill-Level Monitoring - ToF sensors measure distance to waste surface with mm accuracy',
      'Visual Waste Auditing - 2 MP camera captures bin contents for contamination detection',
      'Illegal Dumping Detection - Radar triggers instant image capture and alert',
      'Air Quality and Weather Stations - Low-power platform for remote environmental sensors',
      'Remote Site Surveillance - Motion-triggered capture with months of battery life',
    ],
  },
  {
    id: 'cc-extended',
    name: 'Compact Camera',
    subtitle: 'Extended Battery',
    model: 'CC-PCB-SPEC-001-XB',
    batteryLife: '12-24+ months',
    batteryCapacity: '6,000 mAh',
    description: 'The same Compact Camera platform with a higher-capacity 6,000 mAh battery pack for extended deployment scenarios. Designed for remote or hard-to-access locations where maintenance visits are infrequent. Double the battery life of the standard model with identical sensor and connectivity capabilities.',
    highlights: [
      'ESP32-S3 dual-core processor, 240 MHz',
      '2 MP camera (1600x1200) with JPEG output',
      'Up to 3 Time-of-Flight distance sensors (2-8m range)',
      'Microwave Doppler radar motion detection (5-9m, through-wall)',
      'NB-IoT & Cat-M cellular with built-in GNSS',
      'WiFi 802.11 b/g/n + Bluetooth 5.0 BLE',
      'HDC1080 temperature & humidity sensor',
      '35 nA sleep current - effectively zero standby drain',
      'USB Type-C power + data interface',
      'MicroSD card slot for local storage (up to 32 GB)',
      '6,000 mAh extended battery - 2x standard battery life',
    ],
    keySpecs: [
      { label: 'Processor', value: 'ESP32-S3 - dual-core, 240 MHz, WiFi and Bluetooth 5' },
      { label: 'Camera', value: '2 Megapixel (1600 x 1200), JPEG output, up to 30 fps' },
      { label: 'Distance Sensing', value: 'Up to 3 ToF sensors (2-8 m range, mm accuracy)' },
      { label: 'Motion Detection', value: 'Microwave Doppler radar, 5-9 m range, through-wall' },
      { label: 'Temperature & Humidity', value: 'HDC1080 - +/-0.2 C, +/-2% RH' },
      { label: 'Sleep Current', value: '35 nA - effectively zero standby drain' },
      { label: 'On-board Storage', value: '64 Mbit flash + MicroSD card slot' },
      { label: 'Data Interface', value: 'USB Type-C (power + data)' },
    ],
    sensorSpecs: [
      { label: 'Camera Sensor', value: 'OmniVision OV2640' },
      { label: 'Resolution', value: '2 MP - 1600 x 1200 (UXGA)' },
      { label: 'Output Format', value: 'JPEG (hardware-encoded), YUV, RGB' },
      { label: 'Frame Rate', value: 'Up to 15 fps full res, 30 fps at SVGA' },
      { label: 'Field of View', value: '~65 degrees (lens-dependent)' },
      { label: 'ToF Sensors', value: 'VL53L0X (2m), VL53L1 (8m), VL53L4ED (6m, multizone)' },
      { label: 'ToF Accuracy', value: '+/- 3% across all models' },
      { label: 'Radar Technology', value: 'RCWL-0516 Microwave Doppler' },
      { label: 'Radar Range', value: '5-9 m adjustable, 360 degree omnidirectional' },
      { label: 'Through-Wall', value: 'Yes - non-metallic walls, wood, and glass' },
      { label: 'Temp/Humidity Sensor', value: 'Texas Instruments HDC1080DMBR' },
      { label: 'Temp Range', value: '-40 C to +125 C, +/-0.2 C accuracy' },
      { label: 'Humidity Range', value: '0% to 100% RH, +/-2% accuracy' },
    ],
    connectivitySpecs: [
      { label: 'Cellular Module', value: 'SIMCom SIM7080G' },
      { label: 'Standards', value: 'LTE Cat-NB2 (NB-IoT) and LTE Cat-M1' },
      { label: 'Upload Speed', value: 'Up to 127 kbps (NB-IoT) / 589 kbps (Cat-M)' },
      { label: 'GNSS', value: 'GPS, GLONASS, BeiDou, Galileo - built-in' },
      { label: 'SIM Type', value: 'Nano SIM (4FF)' },
      { label: 'Antenna', value: 'External SMA connector (50 ohm, DC-6 GHz)' },
      { label: 'Protocols', value: 'TCP/IP, UDP, HTTP(S), MQTT(S), CoAP, LwM2M' },
      { label: 'WiFi Standard', value: 'IEEE 802.11 b/g/n (2.4 GHz), 150 Mbps' },
      { label: 'WiFi Range', value: '100-400 m line of sight' },
      { label: 'WiFi Security', value: 'WPA / WPA2 / WPA3-Personal' },
      { label: 'Bluetooth', value: 'Bluetooth 5.0 (Low Energy), 30-100 m range' },
    ],
    powerSpecs: [
      { label: 'Deep Sleep', value: '35 nA (timer only)' },
      { label: 'Sensor Reading', value: '55 mA typical, 70 mA peak' },
      { label: 'Image Capture', value: '120 mA typical, 160 mA peak' },
      { label: 'Cellular (NB-IoT)', value: '180 mA typical, 350 mA peak' },
      { label: 'Cellular (Cat-M)', value: '200 mA typical, 490 mA peak' },
      { label: 'WiFi Transmit', value: '240 mA typical, 340 mA peak' },
      { label: 'Typical Full Cycle', value: '180 mA average, ~10 s total' },
      { label: 'Power Input', value: 'USB 5V or 3.7V Li-ion (2.5-4.35V range)' },
    ],
    physicalSpecs: [
      { label: 'Board Format', value: 'A4-class PCB, 2-layer standard FR-4' },
      { label: 'Mounting', value: '2 x M3 screw holes for enclosure integration' },
      { label: 'Connectors', value: 'USB-C, SMA, Nano SIM, MicroSD, 3.5mm audio, battery header' },
      { label: 'Status Indicators', value: '2 x addressable RGB LEDs' },
      { label: 'User Controls', value: '3 x tactile buttons (function, reset, boot)' },
      { label: 'Operating Temp', value: '-40 C to +85 C' },
      { label: 'Storage Temp', value: '-40 C to +125 C' },
      { label: 'ESD Tolerance', value: '+/- 2 kV (Human Body Model)' },
    ],
    applications: [
      'Remote Landfill Monitoring - Extended battery for hard-to-access sites with infrequent visits',
      'Rural Waste Collection Points - Long-life deployment where power access is limited',
      'Bin Fill-Level Monitoring - ToF sensors measure distance to waste surface with mm accuracy',
      'Visual Waste Auditing - 2 MP camera captures bin contents for contamination detection',
      'Illegal Dumping Detection - Radar triggers instant image capture and alert',
      'Environmental Compliance Stations - Multi-month unattended monitoring at remote sites',
    ],
  },
];

// Battery life comparison table data
const batteryLifeTable = [
  { interval: 'Every 5 minutes', activations: 288, standard: '~18 days', extended: '~36 days', useCase: 'High-frequency monitoring' },
  { interval: 'Every 15 minutes', activations: 96, standard: '~52 days', extended: '~104 days', useCase: 'Regular surveillance' },
  { interval: 'Every 30 minutes', activations: 48, standard: '~100 days', extended: '~200 days', useCase: 'Standard remote monitoring' },
  { interval: 'Every 60 minutes', activations: 24, standard: '~190 days', extended: '~380 days', useCase: 'Low-frequency check-ins' },
  { interval: 'Motion-triggered only', activations: 'Variable' as any, standard: '6-12+ months', extended: '12-24+ months', useCase: 'Event-driven alerting' },
];

export default function Marketplace() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailTab, setDetailTab] = useState(0);

  const handleEnquire = (product: Product) => {
    toast({
      title: 'Enquiry Submitted',
      description: `We'll be in touch about the ${product.name} (${product.subtitle}).`,
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Sensor Marketplace"
        subtitle="VisionPipe Compact Camera sensors for waste and environmental monitoring"
      />

      {/* Product Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {products.map((product) => (
          <Grid item xs={12} md={6} key={product.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                {/* Header */}
                <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: product.id === 'cc-extended' ? 'success.main' : 'primary.main',
                    }}
                  >
                    <CameraAlt sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight="bold">
                      {product.name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      {product.subtitle}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Chip label={product.model} size="small" variant="outlined" />
                      <Chip
                        icon={<BatteryChargingFull />}
                        label={product.batteryLife}
                        size="small"
                        color={product.id === 'cc-extended' ? 'success' : 'primary'}
                      />
                      <Chip label={product.batteryCapacity} size="small" variant="outlined" />
                    </Stack>
                  </Box>
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {product.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Key Features */}
                <Typography variant="subtitle2" gutterBottom>Key Features</Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {[
                    { icon: <CameraAlt fontSize="small" />, label: '2 MP Camera' },
                    { icon: <Sensors fontSize="small" />, label: 'ToF Distance' },
                    { icon: <RadioButtonChecked fontSize="small" />, label: 'Radar Motion' },
                    { icon: <CellTower fontSize="small" />, label: 'NB-IoT / Cat-M' },
                    { icon: <Wifi fontSize="small" />, label: 'WiFi' },
                    { icon: <Bluetooth fontSize="small" />, label: 'BLE 5.0' },
                    { icon: <Thermostat fontSize="small" />, label: 'Temp & Humidity' },
                    { icon: <GpsFixed fontSize="small" />, label: 'GNSS' },
                    { icon: <SdStorage fontSize="small" />, label: 'MicroSD' },
                    { icon: <Usb fontSize="small" />, label: 'USB-C' },
                  ].map((feature) => (
                    <Grid item xs={6} key={feature.label}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <CheckCircle color="success" sx={{ fontSize: 16 }} />
                        {feature.icon}
                        <Typography variant="caption">{feature.label}</Typography>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Quick Specs */}
                <Typography variant="subtitle2" gutterBottom>Specifications</Typography>
                <Stack spacing={0.5}>
                  {product.keySpecs.map((spec) => (
                    <Stack direction="row" key={spec.label} justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">{spec.label}</Typography>
                      <Typography variant="caption" fontWeight="medium" sx={{ textAlign: 'right', maxWidth: '60%' }}>
                        {spec.value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Applications */}
                <Typography variant="subtitle2" gutterBottom>Target Applications</Typography>
                <Stack spacing={0.5}>
                  {product.applications.slice(0, 3).map((app) => (
                    <Stack direction="row" spacing={0.5} key={app} alignItems="flex-start">
                      <CheckCircle color="primary" sx={{ fontSize: 14, mt: 0.3 }} />
                      <Typography variant="caption">{app}</Typography>
                    </Stack>
                  ))}
                  {product.applications.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{product.applications.length - 3} more applications
                    </Typography>
                  )}
                </Stack>
              </CardContent>

              {/* Actions */}
              <Box sx={{ p: 2, pt: 0 }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<ShoppingCart />}
                    onClick={() => handleEnquire(product)}
                    fullWidth
                  >
                    Enquire
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Info />}
                    onClick={() => { setSelectedProduct(product); setDetailTab(0); }}
                    fullWidth
                  >
                    Full Specs
                  </Button>
                </Stack>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Battery Life Comparison */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <BatteryChargingFull sx={{ mr: 1, verticalAlign: 'middle' }} />
          Battery Life Comparison
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Estimates based on 3.7V Li-ion battery with image capture and NB-IoT upload each cycle.
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Wake Interval</TableCell>
                <TableCell>Activations/Day</TableCell>
                <TableCell>Standard (3,000 mAh)</TableCell>
                <TableCell>Extended (6,000 mAh)</TableCell>
                <TableCell>Typical Use Case</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {batteryLifeTable.map((row) => (
                <TableRow key={row.interval}>
                  <TableCell>{row.interval}</TableCell>
                  <TableCell>{row.activations}</TableCell>
                  <TableCell>{row.standard}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>{row.extended}</TableCell>
                  <TableCell>{row.useCase}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Operational Modes */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
          Operating Cycle
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The unit operates on a repeating sleep - wake - sense - capture - transmit - sleep cycle. A typical cycle completes in under 15 seconds.
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mode</TableCell>
                <TableCell>What Happens</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Power Draw</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { mode: 'Deep Sleep', desc: 'System fully off. Nano-power timer counting down to next wake-up.', duration: '100 ms - 2 hrs (configurable)', power: '~35 nA' },
                { mode: 'Boot', desc: 'Power supply activates. Processor boots, initialises sensors and camera.', duration: '~500 ms', power: '~80 mA' },
                { mode: 'Sense', desc: 'Distance sensors, temperature and humidity sampled. Motion detector checked.', duration: '~200 ms', power: '~60 mA' },
                { mode: 'Capture', desc: 'Camera acquires JPEG image at up to 2 MP. Buffered to memory or MicroSD.', duration: '~300 ms', power: '~120 mA' },
                { mode: 'Transmit', desc: 'Data and/or image uploaded via NB-IoT or Cat-M. GPS position acquired.', duration: '1-15 s', power: '180-350 mA' },
                { mode: 'Shutdown', desc: 'Processor signals timer to cut power. Returns to deep sleep.', duration: '~10 ms', power: 'Negligible' },
              ].map((row) => (
                <TableRow key={row.mode}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{row.mode}</TableCell>
                  <TableCell>{row.desc}</TableCell>
                  <TableCell>{row.duration}</TableCell>
                  <TableCell>{row.power}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Full Specs Dialog */}
      <Dialog
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedProduct && (
          <>
            <DialogTitle>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: selectedProduct.id === 'cc-extended' ? 'success.main' : 'primary.main' }}>
                  <CameraAlt />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedProduct.name} - {selectedProduct.subtitle}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedProduct.model} | Battery: {selectedProduct.batteryCapacity} | Life: {selectedProduct.batteryLife}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Tabs
                value={detailTab}
                onChange={(_, v) => setDetailTab(v)}
                sx={{ mb: 2 }}
              >
                <Tab label="Sensors" />
                <Tab label="Connectivity" />
                <Tab label="Power" />
                <Tab label="Physical" />
                <Tab label="Applications" />
              </Tabs>

              {detailTab === 0 && (
                <SpecTable specs={selectedProduct.sensorSpecs} />
              )}
              {detailTab === 1 && (
                <SpecTable specs={selectedProduct.connectivitySpecs} />
              )}
              {detailTab === 2 && (
                <SpecTable specs={selectedProduct.powerSpecs} />
              )}
              {detailTab === 3 && (
                <SpecTable specs={selectedProduct.physicalSpecs} />
              )}
              {detailTab === 4 && (
                <Stack spacing={1}>
                  {selectedProduct.applications.map((app, i) => (
                    <Stack direction="row" spacing={1} key={i} alignItems="flex-start">
                      <CheckCircle color="primary" sx={{ mt: 0.3 }} />
                      <Typography variant="body2">{app}</Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedProduct(null)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<ShoppingCart />}
                onClick={() => { handleEnquire(selectedProduct); setSelectedProduct(null); }}
              >
                Enquire
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

function SpecTable({ specs }: { specs: ProductSpec[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Parameter</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Specification</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {specs.map((spec) => (
            <TableRow key={spec.label}>
              <TableCell sx={{ fontWeight: 'medium', width: '35%' }}>{spec.label}</TableCell>
              <TableCell>{spec.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
