import { useState } from 'react';
import { Card, Table, Tag, Progress, Space, Input, Button, Alert, Spin, Typography, Tooltip, Skeleton } from 'antd';
import { 
  SearchOutlined, 
  DeploymentUnitOutlined,
  ReconciliationOutlined,
  WarningOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import PageHeader from '@/components/PageHeader';
import { useMutation } from '@tanstack/react-query';

const { Title, Text } = Typography;

interface MaterialData {
  component: string;
  recyclable: boolean;
  processingMethod: string;
  recoveryRate: number;
  disposalInstructions: string;
  notes: string;
}

function MaterialAnalysis() {
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisResults, setAnalysisResults] = useState<MaterialData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { mutate: analyzeProduct, isPending: isLoading } = useMutation({
    mutationFn: async (product: string) => {
      const response = await fetch('/api/material-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze product');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('Analysis results:', data);
      if (data.components && Array.isArray(data.components)) {
        setAnalysisResults(data.components);
      } else {
        setError('No analysis results available');
      }
    },
    onError: (error) => {
      console.error('Analysis error:', error);
      setError('Failed to analyze the product. Please try again.');
    },
  });

  const getDisposalIcon = (recyclable: boolean, processingMethod: string) => {
    if (processingMethod.toLowerCase().includes('hazard') || processingMethod.toLowerCase().includes('special')) {
      return <WarningOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />;
    }
    if (recyclable) {
      return <ReconciliationOutlined style={{ color: '#52c41a', fontSize: '20px' }} />;
    }
    return <DeleteOutlined style={{ color: '#faad14', fontSize: '20px' }} />;
  };

  const getDisposalColor = (recyclable: boolean, processingMethod: string) => {
    if (processingMethod.toLowerCase().includes('hazard') || processingMethod.toLowerCase().includes('special')) {
      return 'error';
    }
    if (recyclable) {
      return 'success';
    }
    return 'warning';
  };

  const columns = [
    {
      title: 'Disposal Type',
      key: 'disposal',
      width: 100,
      fixed: 'left' as const,
      render: (_: any, record: MaterialData) => (
        <Tooltip title={`${record.recyclable ? 'Recyclable' : 'Non-Recyclable'} - ${record.processingMethod}`}>
          <div style={{ textAlign: 'center' }}>
            {getDisposalIcon(record.recyclable, record.processingMethod)}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Component',
      dataIndex: 'component',
      key: 'component',
      width: 200,
      render: (text: string, record: MaterialData) => (
        <Space>
          <Text strong>{text}</Text>
          <Tag color={getDisposalColor(record.recyclable, record.processingMethod)}>
            {record.recyclable ? 'Recyclable' : 'Non-Recyclable'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Processing Method',
      dataIndex: 'processingMethod',
      key: 'processingMethod',
      width: 200,
      render: (text: string) => (
        <Space>
          <DeploymentUnitOutlined />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Recovery Rate',
      dataIndex: 'recoveryRate',
      key: 'recoveryRate',
      width: 150,
      render: (rate: number) => (
        <Tooltip title={`${rate}% recoverable`}>
          <Progress 
            percent={rate} 
            size="small"
            status={rate >= 70 ? "success" : rate >= 40 ? "normal" : "exception"}
            format={(percent) => `${percent}%`}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Disposal Instructions',
      dataIndex: 'disposalInstructions',
      key: 'disposalInstructions',
      width: 300,
      render: (text: string) => (
        <Space>
          <InfoCircleOutlined />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: 250,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis>{text}</Text>
        </Tooltip>
      ),
    },
  ];

  const handleAnalyze = () => {
    if (!searchTerm.trim()) {
      setError('Please enter a product to analyze');
      return;
    }

    setError(null);
    setAnalysisResults([]);
    analyzeProduct(searchTerm);
  };

  const renderLoadingSkeleton = () => (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Skeleton.Button active size="large" style={{ width: 200 }} />
        <Alert
          message={
            <Space>
              <Spin />
              <Text>Analyzing material components...</Text>
            </Space>
          }
          description="Our AI is breaking down the product into its components and analyzing their recyclability."
          type="info"
          showIcon
        />
        <div style={{ padding: '20px 0' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <Space size="large" style={{ width: '100%' }}>
                <Skeleton.Avatar active size="large" style={{ marginRight: 8 }} />
                <Skeleton.Input active size="small" style={{ width: 150 }} />
                <Skeleton.Input active size="small" style={{ width: 100 }} />
                <Skeleton.Input active size="small" style={{ width: 200 }} />
                <Skeleton.Input active size="small" style={{ width: 150 }} />
              </Space>
            </div>
          ))}
        </div>
      </Space>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="Material Analysis"
        subtitle="AI-powered analysis of product components and recyclability"
      />

      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Enter a product (e.g., smartphone, laptop, household appliance)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={handleAnalyze}
                prefix={<SearchOutlined />}
                size="large"
              />
              <Button 
                type="primary" 
                onClick={handleAnalyze} 
                loading={isLoading}
                icon={<DeploymentUnitOutlined />}
                size="large"
              >
                Analyze
              </Button>
            </Space.Compact>

            {error && (
              <Alert message={error} type="error" showIcon />
            )}
          </Space>
        </Card>

        {isLoading ? (
          renderLoadingSkeleton()
        ) : analysisResults.length > 0 && (
          <Card 
            title={
              <Space>
                <DeploymentUnitOutlined />
                <span>Material Analysis Results</span>
              </Space>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                message="Disposal Guide"
                description={
                  <Space wrap>
                    <Space>
                      <ReconciliationOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                      <Text>Recyclable</Text>
                    </Space>
                    <Space>
                      <WarningOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
                      <Text>Hazardous/Special</Text>
                    </Space>
                    <Space>
                      <DeleteOutlined style={{ color: '#faad14', fontSize: '16px' }} />
                      <Text>General Waste</Text>
                    </Space>
                  </Space>
                }
                type="info"
                showIcon
              />

              <Table
                columns={columns}
                dataSource={analysisResults}
                pagination={false}
                scroll={{ x: 1200 }}
                rowKey="component"
              />
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
}

export default MaterialAnalysis;