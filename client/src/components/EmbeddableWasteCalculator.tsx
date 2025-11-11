import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Typography, Space, Divider } from 'antd';

const { Title, Text } = Typography;

interface WasteType {
  type: string;
  costPerUnit: number;
  unit: string;
}

interface AdditionalFee {
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
}

interface CalculatorConfig {
  id: string;
  name: string;
  wasteTypes: WasteType[];
  additionalFees: AdditionalFee[];
}

interface WasteVolume {
  type: string;
  volume: number;
}

export default function EmbeddableWasteCalculator({ configId }: { configId: string }) {
  const [form] = Form.useForm();
  const [config, setConfig] = useState<CalculatorConfig | null>(null);
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<{ label: string; amount: number }[]>([]);

  useEffect(() => {
    // Fetch calculator configuration
    fetch(`/api/calculator-configs/${configId}`)
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Error loading calculator config:', err));
  }, [configId]);

  const calculateCost = (values: { volumes: WasteVolume[] }) => {
    if (!config) return;

    let subtotal = 0;
    const costBreakdown = [];

    // Calculate waste disposal costs
    values.volumes.forEach(volume => {
      const wasteType = config.wasteTypes.find(w => w.type === volume.type);
      if (wasteType) {
        const cost = volume.volume * wasteType.costPerUnit;
        subtotal += cost;
        costBreakdown.push({
          label: `${wasteType.type} (${volume.volume} ${wasteType.unit})`,
          amount: cost
        });
      }
    });

    costBreakdown.push({ label: 'Subtotal', amount: subtotal });

    // Add additional fees
    let total = subtotal;
    config.additionalFees.forEach(fee => {
      const feeAmount = fee.type === 'percentage' 
        ? (subtotal * fee.amount / 100)
        : fee.amount;
      total += feeAmount;
      costBreakdown.push({
        label: fee.name,
        amount: feeAmount
      });
    });

    setBreakdown(costBreakdown);
    setCalculatedCost(total);
  };

  if (!config) {
    return (
      <Card>
        <Text>Loading calculator...</Text>
      </Card>
    );
  }

  return (
    <Card className="waste-calculator-embed">
      <Title level={4}>{config.name}</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={calculateCost}
      >
        <Form.List name="volumes">
          {(fields, { add, remove }) => (
            <Space direction="vertical" style={{ width: '100%' }}>
              {fields.map((field, index) => (
                <Space key={field.key} align="baseline">
                  <Form.Item
                    {...field}
                    name={[field.name, 'type']}
                    label="Waste Type"
                    rules={[{ required: true }]}
                  >
                    <Select style={{ width: 200 }}>
                      {config.wasteTypes.map(waste => (
                        <Select.Option key={waste.type} value={waste.type}>
                          {waste.type} (${waste.costPerUnit}/{waste.unit})
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'volume']}
                    label="Volume"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" style={{ width: 120 }} />
                  </Form.Item>
                  <Button onClick={() => remove(field.name)} type="text" danger>
                    Remove
                  </Button>
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} block>
                Add Waste Volume
              </Button>
            </Space>
          )}
        </Form.List>

        <Form.Item className="mt-4">
          <Button type="primary" htmlType="submit">
            Calculate Cost
          </Button>
        </Form.Item>
      </Form>

      {calculatedCost !== null && (
        <>
          <Divider />
          <Title level={5}>Cost Breakdown</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            {breakdown.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>{item.label}</Text>
                <Text strong={index === breakdown.length - 1}>
                  ${item.amount.toFixed(2)}
                </Text>
              </div>
            ))}
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Title level={4}>Total Cost</Title>
              <Title level={4}>${calculatedCost.toFixed(2)}</Title>
            </div>
          </Space>
        </>
      )}
    </Card>
  );
}
