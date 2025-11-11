import { Card, Table, DatePicker, Select, Button, Space, Typography, Checkbox, Progress, Alert } from 'antd';
import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

interface ReportConfig {
  sections: string[];
  dateRange: [Date, Date] | null;
  format: 'pdf' | 'excel';
  includeGraphics: boolean;
}

function Reports() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    sections: ['waste', 'recycling', 'carbon', 'vendors', 'costs', 'goals'],
    dateRange: null,
    format: 'pdf',
    includeGraphics: true
  });

  const { toast } = useToast();

  const { data: metrics } = useQuery({
    queryKey: ['/api/metrics/sustainability']
  });

  const data = [
    { month: 'Jan', type: 'Total Waste', value: 100 },
    { month: 'Jan', type: 'Recycled', value: 75 },
    { month: 'Feb', type: 'Total Waste', value: 120 },
    { month: 'Feb', type: 'Recycled', value: 85 },
    { month: 'Mar', type: 'Total Waste', value: 90 },
    { month: 'Mar', type: 'Recycled', value: 70 },
  ];

  const columnConfig = {
    data,
    xField: 'month',
    yField: 'value',
    seriesField: 'type',
    isGroup: true,
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    label: {
      position: 'top',
    },
    legend: {
      layout: 'horizontal',
      position: 'bottom'
    }
  };

  const tableColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Waste Type',
      dataIndex: 'wasteType',
      key: 'wasteType',
    },
    {
      title: 'Quantity (kg)',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => `$${cost.toFixed(2)}`,
    },
  ];

  const tableData = [
    {
      key: '1',
      date: '2024-03-01',
      wasteType: 'General Waste',
      quantity: 150,
      cost: 300.50,
    },
    {
      key: '2',
      date: '2024-03-02',
      wasteType: 'Recyclables',
      quantity: 80,
      cost: 120.75,
    },
  ];

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

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="View and generate sustainability reports"
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Report Generation Configuration */}
        <Card title="Generate Custom Report">
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

            <Space>
              <Text strong>Date Range:</Text>
              <RangePicker
                onChange={(dates) => 
                  setReportConfig(prev => ({ 
                    ...prev, 
                    dateRange: dates ? [dates[0]!.toDate(), dates[1]!.toDate()] : null 
                  }))
                }
              />
              <Select
                value={reportConfig.format}
                onChange={format => setReportConfig(prev => ({ ...prev, format }))}
                style={{ width: 120 }}
              >
                <Select.Option value="pdf">PDF</Select.Option>
                <Select.Option value="excel">Excel</Select.Option>
              </Select>
              <Checkbox
                checked={reportConfig.includeGraphics}
                onChange={e => setReportConfig(prev => ({ ...prev, includeGraphics: e.target.checked }))}
              >
                Include Graphics
              </Checkbox>
              <Button
                type="primary"
                icon={generateReport.isPending ? <LoadingOutlined /> : <DownloadOutlined />}
                onClick={handleGenerate}
                loading={generateReport.isPending}
              >
                Generate Report
              </Button>
            </Space>
          </Space>
        </Card>

        {/* Data Visualization */}
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <RangePicker />
            <Select
              defaultValue="all"
              style={{ width: 120 }}
            >
              <Select.Option value="all">All Types</Select.Option>
              <Select.Option value="general">General</Select.Option>
              <Select.Option value="recyclable">Recyclable</Select.Option>
            </Select>
          </Space>

          <div style={{ height: 300 }}>
            <Column {...columnConfig} />
          </div>
        </Card>

        {/* Detailed Records */}
        <Card title="Detailed Records">
          <Table
            columns={tableColumns}
            dataSource={tableData}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>
    </div>
  );
}

export default Reports;