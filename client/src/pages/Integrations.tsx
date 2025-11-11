import { useState } from 'react';
import { Card, List, Button, Space, Tag, Typography, Modal, Form, Input, Alert } from 'antd';
import { ApiOutlined, CheckCircleOutlined, DisconnectOutlined } from '@ant-design/icons';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { Title, Text, Paragraph } = Typography;

interface Integration {
  id: number;
  name: string;
  description: string;
  status: 'connected' | 'disconnected';
  category: string;
  icon: string;
  features: string[];
  documentation_url: string;
  provider_url: string;
}

function Integrations() {
  const [isConnectModalVisible, setIsConnectModalVisible] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch integrations
  const { data: integrations, isLoading, error } = useQuery<Integration[]>({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await fetch('/api/integrations');
      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }
      return response.json();
    },
  });

  // Connect integration mutation
  const connectMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      const response = await fetch(`/api/integrations/connect/${integrationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: form.getFieldsValue() }),
      });
      if (!response.ok) {
        throw new Error('Failed to connect integration');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Success",
        description: `Successfully connected ${selectedIntegration?.name}`,
      });
      setIsConnectModalVisible(false);
      form.resetFields();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to connect integration',
        variant: "destructive",
      });
    },
  });

  // Disconnect integration mutation
  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      const response = await fetch(`/api/integrations/disconnect/${integrationId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to disconnect integration');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Success",
        description: "Integration disconnected successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to disconnect integration',
        variant: "destructive",
      });
    },
  });

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsConnectModalVisible(true);
  };

  const handleDisconnect = (integration: Integration) => {
    disconnectMutation.mutate(integration.id);
  };

  const onFinishConnect = () => {
    if (selectedIntegration) {
      connectMutation.mutate(selectedIntegration.id);
    }
  };

  if (isLoading) {
    return <div>Loading integrations...</div>;
  }

  if (error) {
    return <Alert message="Error loading integrations" type="error" />;
  }

  return (
    <div>
      <PageHeader
        title="Integrations"
        subtitle="Connect and manage third-party integrations"
      />

      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Card>
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
            dataSource={integrations}
            renderItem={(integration: Integration) => (
              <List.Item>
                <Card hoverable>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Space>
                      <span style={{ fontSize: '24px' }}>{integration.icon}</span>
                      <div>
                        <Title level={4} style={{ margin: 0 }}>{integration.name}</Title>
                        <Tag color={integration.status === 'connected' ? 'success' : 'default'}>
                          {integration.status === 'connected' ? (
                            <><CheckCircleOutlined /> Connected</>
                          ) : (
                            <><DisconnectOutlined /> Disconnected</>
                          )}
                        </Tag>
                      </div>
                    </Space>

                    <Paragraph>{integration.description}</Paragraph>

                    <div>
                      <Text strong>Features:</Text>
                      <ul style={{ paddingLeft: '20px' }}>
                        {integration.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      type={integration.status === 'connected' ? 'default' : 'primary'}
                      icon={integration.status === 'connected' ? <DisconnectOutlined /> : <ApiOutlined />}
                      onClick={() => integration.status === 'connected' ?
                        handleDisconnect(integration) :
                        handleConnect(integration)
                      }
                      block
                    >
                      {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                    </Button>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        </Card>
      </Space>

      <Modal
        title={`Connect ${selectedIntegration?.name}`}
        open={isConnectModalVisible}
        onCancel={() => setIsConnectModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinishConnect}
        >
          <Alert
            message="Integration Setup"
            description={`Please provide your ${selectedIntegration?.name} API credentials to enable the integration.`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: 'Please enter your API key' }]}
          >
            <Input.Password placeholder="Enter API key" />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={connectMutation.isPending}>
              Connect
            </Button>
            <Button onClick={() => setIsConnectModalVisible(false)}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}

export default Integrations;