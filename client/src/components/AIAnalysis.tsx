import { useState } from 'react';
import { Card, Row, Col, Typography, Space, Button, Input, Tag, Spin, Progress, Statistic } from 'antd';
import { ExperimentOutlined, RobotOutlined, CloudUploadOutlined, ThunderboltOutlined, LineChartOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export function AIAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features = [
    {
      title: 'Sustainability Impact Analysis',
      icon: <LineChartOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      description: 'AI-powered analysis of your sustainability metrics and environmental impact.',
      color: '#f6ffed',
      borderColor: '#b7eb8f'
    },
    {
      title: 'Waste Classification',
      icon: <ExperimentOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      description: 'Advanced ML models to classify and categorize waste materials.',
      color: '#e6f7ff',
      borderColor: '#91d5ff'
    },
    {
      title: 'Process Optimization',
      icon: <ThunderboltOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
      description: 'Smart recommendations for optimizing recycling processes.',
      color: '#f9f0ff',
      borderColor: '#d3adf7'
    },
  ];

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="p-6">
      <Card className="mb-6 shadow-sm">
        <Space direction="vertical" size="large" className="w-full">
          {/* Header Section */}
          <div className="text-center mb-8">
            <Space align="center">
              <RobotOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <Title level={2} style={{ margin: 0 }}>AI-Powered Sustainability Analysis</Title>
            </Space>
            <Paragraph type="secondary" className="mt-2">
              Leverage cutting-edge artificial intelligence to transform your sustainability initiatives
            </Paragraph>
          </div>

          {/* Features Grid */}
          <Row gutter={[16, 16]}>
            {features.map((feature) => (
              <Col xs={24} md={8} key={feature.title}>
                <Card
                  hoverable
                  style={{
                    background: feature.color,
                    borderColor: feature.borderColor,
                    height: '100%'
                  }}
                  onClick={() => setSelectedFeature(feature.title)}
                >
                  <Space direction="vertical" align="center" className="w-full">
                    {feature.icon}
                    <Title level={4}>{feature.title}</Title>
                    <Text type="secondary" className="text-center block">
                      {feature.description}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Analysis Dashboard */}
          {selectedFeature && (
            <Card
              title={
                <Space>
                  <CloudUploadOutlined />
                  <span>Analysis Dashboard</span>
                </Space>
              }
              className="mt-8"
            >
              <Space direction="vertical" className="w-full" size="large">
                <TextArea
                  rows={4}
                  placeholder="Enter your sustainability data or description for analysis..."
                  className="mb-4"
                />

                <div className="text-center">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ExperimentOutlined />}
                    onClick={handleAnalyze}
                    loading={isAnalyzing}
                  >
                    Start Analysis
                  </Button>
                </div>

                {isAnalyzing && (
                  <div className="text-center py-8">
                    <Space direction="vertical" className="w-full" align="center">
                      <Spin size="large" />
                      <Progress percent={45} status="active" />
                      <Text type="secondary">Analyzing data using advanced AI models...</Text>
                    </Space>
                  </div>
                )}

                {/* Analysis Metrics */}
                <Row gutter={[16, 16]} className="mt-8">
                  <Col xs={24} md={8}>
                    <Card>
                      <Statistic
                        title="Confidence Score"
                        value={98.5}
                        suffix="%"
                        precision={1}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card>
                      <Statistic
                        title="Processing Time"
                        value={2.4}
                        suffix="s"
                        precision={1}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card>
                      <Statistic
                        title="Insights Generated"
                        value={12}
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Analysis Tags */}
                <div className="mt-8">
                  <Space wrap>
                    <Tag color="success">High Accuracy</Tag>
                    <Tag color="processing">Real-time Analysis</Tag>
                    <Tag color="warning">Energy Efficient</Tag>
                    <Tag color="default">ML-Powered</Tag>
                  </Space>
                </div>
              </Space>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
}

export default AIAnalysis;