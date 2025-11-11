import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, Typography, ButtonGroup, Button } from '@mui/material';
import { Line, Bar, Pie, Area } from '@ant-design/plots';
import { Download as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  dataKey: string;
  timeframe: string;
  aggregation: 'sum' | 'average' | 'max' | 'min';
}

interface ChartWidgetProps {
  config: ChartConfig;
}

export function ChartWidget({ config }: ChartWidgetProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/metrics/chart-data', config],
    queryFn: async () => {
      console.log('Fetching chart data with config:', {
        id: config.id,
        type: config.type,
        title: config.title,
        dataKey: config.dataKey,
        timeframe: config.timeframe,
        aggregation: config.aggregation
      });

      if (!config.dataKey) {
        console.error('No metric selected for the chart');
        throw new Error('No metric selected for the chart');
      }

      const url = `/api/metrics/chart-data?metric=${encodeURIComponent(config.dataKey)}&timeframe=${config.timeframe || '1m'}&aggregation=${config.aggregation || 'sum'}`;
      console.log('Making request to:', url);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Chart data fetch failed:', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
          throw new Error(errorText || 'Failed to fetch chart data');
        }
        const data = await response.json();
        console.log('Received chart data:', data);
        return data;
      } catch (err) {
        console.error('Error fetching chart data:', err);
        throw err;
      }
    },
    enabled: Boolean(config.dataKey)
  });

  const handleExportCSV = () => {
    if (!chartData?.length) return;

    const csvContent = [
      ['Timestamp', 'Value', 'Category'],
      ...chartData.map(row => [
        row.timestamp,
        row.value,
        row.category
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${config.title || 'chart'}_${new Date().toISOString()}.csv`);
  };

  const handleExportExcel = () => {
    if (!chartData?.length) return;

    const ws = XLSX.utils.json_to_sheet(chartData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chart Data');
    XLSX.writeFile(wb, `${config.title || 'chart'}_${new Date().toISOString()}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!chartData?.length) return;

    // Get the chart canvas element
    const chartContainer = document.getElementById(`chart-container-${config.id}`);
    const canvasElement = chartContainer?.querySelector('canvas');

    if (!canvasElement) {
      console.error('Could not find chart canvas element', {
        containerId: `chart-container-${config.id}`,
        containerExists: !!chartContainer,
        containerHTML: chartContainer?.innerHTML
      });
      return;
    }

    try {
      // Create PDF
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm'
      });

      // Add title
      doc.setFontSize(16);
      doc.text(config.title || 'Chart Data', 20, 20);

      // Calculate dimensions to maintain aspect ratio
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imageWidth = pageWidth - 40; // 20mm margin on each side
      const imageHeight = (canvasElement.height * imageWidth) / canvasElement.width;

      // Add chart image
      const imgData = canvasElement.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 20, 30, imageWidth, imageHeight);

      // Add data table on new page
      doc.addPage();
      doc.setFontSize(12);

      // Add table headers
      const headers = ['Timestamp', 'Value', 'Category'];
      let yPos = 20;
      const rowHeight = 10;
      const colWidths = [70, 50, 70];
      const startX = 20;

      // Style for headers
      doc.setFont('helvetica', 'bold');
      headers.forEach((header, i) => {
        doc.text(header, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), yPos);
      });

      // Style for data
      doc.setFont('helvetica', 'normal');
      yPos += rowHeight;

      // Add data rows
      chartData.forEach(row => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(row.timestamp, startX, yPos);
        doc.text(row.value.toString(), startX + colWidths[0], yPos);
        doc.text(row.category, startX + colWidths[0] + colWidths[1], yPos);
        yPos += rowHeight;
      });

      // Save the PDF
      doc.save(`${config.title || 'chart'}_${new Date().toISOString()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Typography color="error" align="center">
          {error instanceof Error ? error.message : 'Failed to load chart data. Please try again.'}
        </Typography>
      </Box>
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Typography color="text.secondary" align="center">
          No data available for the selected metric and timeframe
        </Typography>
      </Box>
    );
  }

  console.log('Processing chart data:', data);

  const chartData = data.map((item: any) => ({
    timestamp: new Date(item.timestamp).toLocaleDateString(),
    value: Number(item.value),
    category: item.category || config.dataKey
  }));

  console.log('Final chart data:', chartData);

  const chartProps = {
    data: chartData,
    xField: 'timestamp',
    yField: 'value',
    seriesField: 'category',
    height: 350,
    padding: 'auto',
    xAxis: {
      type: 'time',
      label: {
        formatter: (v: string) => new Date(v).toLocaleDateString()
      }
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.category || config.dataKey,
        value: datum.value.toFixed(2)
      }),
    },
    legend: {
      position: 'top'
    }
  };

  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {config.title}
        </Typography>
        <ButtonGroup size="small" variant="outlined">
          <Button onClick={handleExportCSV} startIcon={<DownloadIcon />}>
            CSV
          </Button>
          <Button onClick={handleExportExcel} startIcon={<DownloadIcon />}>
            Excel
          </Button>
          <Button onClick={handleExportPDF} startIcon={<DownloadIcon />}>
            PDF
          </Button>
        </ButtonGroup>
      </Box>
      <Box id={`chart-container-${config.id}`} sx={{ width: '100%', height: '350px' }}>
        {(() => {
          switch (config.type) {
            case 'line':
              return <Line {...chartProps} smooth />;
            case 'bar':
              return <Bar {...chartProps} />;
            case 'area':
              return <Area {...chartProps} smooth />;
            case 'pie':
              return (
                <Pie
                  {...chartProps}
                  angleField="value"
                  colorField="category"
                  radius={0.8}
                  label={{
                    type: 'outer'
                  }}
                />
              );
            default:
              return null;
          }
        })()}
      </Box>
    </Box>
  );
}