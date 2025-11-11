import { useState } from 'react';
import { Card, Form, Input, Select, Button, Space, Typography, Tabs, Divider, List } from 'antd';
import { CopyOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface CalculatorField {
  name: string;
  type: 'number' | 'select';
  unit?: string;
  options?: string[];
  label: string;
}

interface CalculatorFormula {
  name: string;
  formula: string;
  description: string;
}

interface CalculatorConfig {
  id?: number;
  name: string;
  fields: CalculatorField[];
  formulas: CalculatorFormula[];
}

const emptyConfig: CalculatorConfig = {
  name: '',
  fields: [],
  formulas: []
};

export default function WasteCalculator() {
  const [form] = Form.useForm();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('config');
  const [selectedConfig, setSelectedConfig] = useState<CalculatorConfig | null>(null);
  const [embedCode, setEmbedCode] = useState('');
  const queryClient = useQueryClient();

  // Fetch saved calculator configurations
  const { data: calculatorConfigs, isLoading } = useQuery<CalculatorConfig[]>({
    queryKey: ['/api/admin/calculator-configs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/calculator-configs');
      if (!response.ok) throw new Error('Failed to fetch calculator configurations');
      return response.json();
    },
  });

  // Save calculator configuration
  const saveMutation = useMutation({
    mutationFn: async (config: CalculatorConfig) => {
      const dataToSend = {
        ...config,
        fields: config.fields.length ? config.fields : [{
          name: 'defaultField',
          type: 'number',
          label: 'Default Field',
          unit: 'kg'
        }],
        formulas: config.formulas.length ? config.formulas : [{
          name: 'defaultFormula',
          formula: '{defaultField} * 1',
          description: 'Default calculation'
        }]
      };

      console.log('Sending config to server:', dataToSend);

      const response = await fetch('/api/admin/calculator-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to save calculator configuration');
      }

      return response.json();
    },
    onSuccess: (savedConfig) => {
      toast({
        title: "Configuration Saved",
        description: "Calculator configuration has been saved successfully.",
      });
      setSelectedConfig(savedConfig);
      generateEmbedCode(savedConfig);
      // Invalidate and refetch the calculator configs
      queryClient.invalidateQueries({ queryKey: ['/api/admin/calculator-configs'] });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSave = async (values: CalculatorConfig) => {
    try {
      await saveMutation.mutateAsync(values);
    } catch (error) {
      console.error('Error in handleSave:', error);
    }
  };

  const generateEmbedCode = (config: CalculatorConfig) => {
    const code = `
<iframe 
  src="${window.location.origin}/api/admin/calculator-configs/public/${config.id}"
  width="100%"
  height="600"
  style="border: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
  title="Waste Calculator"
></iframe>
<script>
  // Automatically adjust iframe height based on content
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'calculator-height') {
      const iframe = document.querySelector('iframe[src*="/calculator-configs/public/${config.id}"]');
      if (iframe) iframe.style.height = e.data.height + 'px';
    }
  });
</script>`.trim();
    setEmbedCode(code);
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
    });
  };

  const handleConfigSelect = (config: CalculatorConfig) => {
    setSelectedConfig(config);
    form.setFieldsValue(config);
    generateEmbedCode(config);
    setActiveTab('embed');
  };

  const openPublicCalculator = (config: CalculatorConfig) => {
    window.open(`/calculator?id=${config.id}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waste Calculator Builder"
        subtitle="Create and manage embeddable waste cost calculators"
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <Card title="Saved Calculators">
            <List
              loading={isLoading}
              dataSource={calculatorConfigs}
              renderItem={(config) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      onClick={() => handleConfigSelect(config)}
                      key="embed"
                    >
                      View Embed Code
                    </Button>,
                    <Button
                      type="link"
                      icon={<LinkOutlined />}
                      onClick={() => openPublicCalculator(config)}
                      key="preview"
                    >
                      Preview
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={config.name}
                    description={`${config.fields.length} fields, ${config.formulas.length} formulas`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>

        <div className="col-span-8">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Calculator Configuration" key="config">
              <Card>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSave}
                  initialValues={selectedConfig || emptyConfig}
                >
                  <Form.Item
                    name="name"
                    label="Calculator Name"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="e.g., Standard Waste Calculator" />
                  </Form.Item>

                  <Title level={5}>Input Fields</Title>
                  <Form.List name="fields">
                    {(fields, { add, remove }) => (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {fields.map((field) => (
                          <Card key={field.key} size="small">
                            <Space align="baseline">
                              <Form.Item
                                {...field}
                                name={[field.name, 'label']}
                                label="Field Label"
                                rules={[{ required: true }]}
                              >
                                <Input placeholder="e.g., Weight of Waste" />
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[field.name, 'name']}
                                label="Field Name (for formula)"
                                rules={[{ required: true }]}
                              >
                                <Input placeholder="e.g., wasteWeight" />
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[field.name, 'type']}
                                label="Field Type"
                                rules={[{ required: true }]}
                              >
                                <Select style={{ width: 120 }}>
                                  <Select.Option value="number">Number</Select.Option>
                                  <Select.Option value="select">Select</Select.Option>
                                </Select>
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[field.name, 'unit']}
                                label="Unit"
                              >
                                <Input placeholder="e.g., kg" />
                              </Form.Item>
                              <Button
                                onClick={() => remove(field.name)}
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                              >
                                Remove
                              </Button>
                            </Space>
                          </Card>
                        ))}
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                        >
                          Add Field
                        </Button>
                      </Space>
                    )}
                  </Form.List>

                  <Divider />

                  <Title level={5}>Calculation Formulas</Title>
                  <Form.List name="formulas">
                    {(fields, { add, remove }) => (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {fields.map((field) => (
                          <Card key={field.key} size="small">
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'name']}
                                label="Result Name"
                                rules={[{ required: true }]}
                              >
                                <Input placeholder="e.g., Total Cost" />
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[field.name, 'formula']}
                                label="Formula"
                                rules={[{ required: true }]}
                                help="Use field names in curly braces, e.g. {wasteWeight} * 10"
                              >
                                <Input.TextArea
                                  placeholder="e.g., {wasteWeight} * 10 + {serviceFee}"
                                  autoSize={{ minRows: 2, maxRows: 6 }}
                                />
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[field.name, 'description']}
                                label="Description"
                                rules={[{ required: true }]}
                              >
                                <Input.TextArea
                                  placeholder="Explain how this calculation works"
                                  autoSize={{ minRows: 2, maxRows: 4 }}
                                />
                              </Form.Item>
                              <Button
                                onClick={() => remove(field.name)}
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                              >
                                Remove Formula
                              </Button>
                            </Space>
                          </Card>
                        ))}
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                        >
                          Add Formula
                        </Button>
                      </Space>
                    )}
                  </Form.List>

                  <Form.Item className="mt-6">
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      htmlType="submit"
                      loading={saveMutation.isPending}
                    >
                      Save Calculator
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </TabPane>

            <TabPane tab="Embed Code" key="embed">
              <Card>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {selectedConfig ? (
                    <>
                      <Title level={5}>Embed code for: {selectedConfig.name}</Title>
                      <Text>Copy and paste this code to embed the calculator on your website:</Text>
                      <Paragraph className="bg-gray-50 p-4 rounded">
                        <pre>{embedCode}</pre>
                      </Paragraph>
                      <Button
                        icon={<CopyOutlined />}
                        onClick={copyEmbedCode}
                      >
                        Copy Code
                      </Button>
                      <Button
                        icon={<LinkOutlined />}
                        onClick={() => openPublicCalculator(selectedConfig)}
                      >
                        Open Calculator in New Tab
                      </Button>
                    </>
                  ) : (
                    <Text type="secondary">
                      Select a calculator from the list to view its embed code.
                    </Text>
                  )}
                </Space>
              </Card>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  );
}