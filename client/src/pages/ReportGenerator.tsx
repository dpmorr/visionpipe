import { useState } from 'react';
import { Card, Button, Space, Checkbox, DatePicker, Radio, Progress, Typography, Alert, List, Table, Tabs } from 'antd';
import { FileTextOutlined, DownloadOutlined, LoadingOutlined, LineChartOutlined, TableOutlined } from '@ant-design/icons';
import PageHeader from '@/components/PageHeader';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface ReportConfig {
  sections: string[];
  dateRange: [Date, Date] | null;
  format: 'pdf' | 'excel';
  includeGraphics: boolean;
}

interface WastePoint {
  id: number;
  name: string;
  location: string;
  process_step: string;
  metrics: {
    waste_reduction: Array<{ timestamp: string; value: number }>;
    recycling_rate: Array<{ timestamp: string; value: number }>;
    carbon_footprint: Array<{ timestamp: string; value: number }>;
    cost_savings: Array<{ timestamp: string; value: number }>;
    vendor_performance: Array<{ timestamp: string; value: number }>;
  };
}

interface Metrics {
  wasteReduction: number;
  recyclingRate: number;
  carbonFootprint: number;
  costSavings: number;
  vendorPerformance: number;
  history: {
    wasteReduction: Array<{ timestamp: string; value: number }>;
    recyclingRate: Array<{ timestamp: string; value: number }>;
    carbonFootprint: Array<{ timestamp: string; value: number }>;
    costSavings: Array<{ timestamp: string; value: number }>;
    vendorPerformance: Array<{ timestamp: string; value: number }>;
  };
  wastePoints: WastePoint[];
}

function ReportGenerator() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    sections: ['waste', 'recycling', 'carbon', 'vendors', 'costs', 'goals'],
    dateRange: null,
    format: 'pdf',
    includeGraphics: true
  });

  const { toast } = useToast();

  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ['/api/metrics/sustainability'],
  });

  const generateReport = useMutation({
    mutationFn: async (config: ReportConfig) => {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sustainability_report_${new Date().toISOString().split('T')[0]}.${reportConfig.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Report generated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleGenerate = () => {
    if (!reportConfig.dateRange) {
      toast({
        title: "Error",
        description: "Please select a date range",
        variant: "destructive"
      });
      return;
    }
    generateReport.mutate(reportConfig);
  };

  const wastePointColumns = [
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Process Step',
      dataIndex: 'process_step',
      key: 'process_step',
    },
    {
      title: 'Waste Reduction',
      dataIndex: 'wasteReduction',
      key: 'wasteReduction',
      render: (_: any, record: WastePoint) => {
        const latest = record.metrics.waste_reduction[record.metrics.waste_reduction.length - 1];
        return latest ? `${latest.value.toFixed(2)}%` : 'N/A';
      },
    },
    {
      title: 'Recycling Rate',
      dataIndex: 'recyclingRate',
      key: 'recyclingRate',
      render: (_: any, record: WastePoint) => {
        const latest = record.metrics.recycling_rate[record.metrics.recycling_rate.length - 1];
        return latest ? `${latest.value.toFixed(2)}%` : 'N/A';
      },
    },
    {
      title: 'Cost Savings',
      dataIndex: 'costSavings',
      key: 'costSavings',
      render: (_: any, record: WastePoint) => {
        const latest = record.metrics.cost_savings[record.metrics.cost_savings.length - 1];
        return latest ? `$${latest.value.toFixed(2)}` : 'N/A';
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sustainability Report Generator"
        subtitle="Generate comprehensive sustainability reports with key metrics and insights"
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title={
          <Space>
            <FileTextOutlined />
            <span>Report Configuration</span>
          </Space>
        }>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>Include Sections:</Text>
              <Checkbox.Group
                options={[
                  { label: 'Waste Management', value: 'waste' },
                  { label: 'Recycling Performance', value: 'recycling' },
                  { label: 'Carbon Footprint', value: 'carbon' },
                  { label: 'Vendor Performance', value: 'vendors' },
                  { label: 'Cost Analysis', value: 'costs' },
                  { label: 'Goal Progress', value: 'goals' }
                ]}
                value={reportConfig.sections}
                onChange={sections => setReportConfig(prev => ({ ...prev, sections: sections as string[] }))}
              />
            </div>

            <div>
              <Text strong>Date Range:</Text>
              <br />
              <RangePicker
                onChange={(dates) => 
                  setReportConfig(prev => ({ 
                    ...prev, 
                    dateRange: dates ? [dates[0]!.toDate(), dates[1]!.toDate()] : null 
                  }))
                }
              />
            </div>

            <div>
              <Text strong>Format:</Text>
              <br />
              <Radio.Group
                value={reportConfig.format}
                onChange={e => setReportConfig(prev => ({ ...prev, format: e.target.value }))}
              >
                <Radio.Button value="pdf">PDF</Radio.Button>
                <Radio.Button value="excel">Excel</Radio.Button>
              </Radio.Group>
            </div>

            <div>
              <Checkbox
                checked={reportConfig.includeGraphics}
                onChange={e => setReportConfig(prev => ({ ...prev, includeGraphics: e.target.checked }))}
              >
                Include Graphics and Charts
              </Checkbox>
            </div>
          </Space>
        </Card>

        <Card title="Metrics Overview">
          <Tabs defaultActiveKey="1">
            <TabPane
              tab={
                <span>
                  <TableOutlined />
                  Waste Points Table
                </span>
              }
              key="1"
            >
              <Table
                dataSource={metrics?.wastePoints}
                columns={wastePointColumns}
                loading={metricsLoading}
                rowKey="id"
                pagination={false}
              />
            </TabPane>
            <TabPane
              tab={
                <span>
                  <LineChartOutlined />
                  Trends
                </span>
              }
              key="2"
            >
              <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={metrics?.history.wasteReduction}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      name="Waste Reduction"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabPane>
          </Tabs>
        </Card>

        <Button
          type="primary"
          icon={generateReport.isPending ? <LoadingOutlined /> : <DownloadOutlined />}
          onClick={handleGenerate}
          loading={generateReport.isPending}
          size="large"
          block
        >
          Generate Report
        </Button>
      </Space>
    </div>
  );
}

export default ReportGenerator;