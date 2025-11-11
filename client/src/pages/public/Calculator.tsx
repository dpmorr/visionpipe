import { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Select, Typography, Button } from 'antd';
import { useQuery } from '@tanstack/react-query';

const { Title, Text } = Typography;

interface CalculatorField {
  name: string;
  type: 'number' | 'select';
  label: string;
  unit?: string;
  options?: string[];
}

interface CalculatorFormula {
  name: string;
  formula: string;
  description: string;
}

interface CalculatorConfig {
  id: number;
  name: string;
  fields: CalculatorField[];
  formulas: CalculatorFormula[];
}

interface CalculationResults {
  [key: string]: number;
}

export default function Calculator() {
  const [form] = Form.useForm();
  const [results, setResults] = useState<CalculationResults>({});
  const configId = new URLSearchParams(window.location.search).get('id');

  console.log('Calculator configId:', configId); // Debug log

  const { data: config, isLoading, error } = useQuery<CalculatorConfig>({
    queryKey: ['calculator-config', configId],
    queryFn: async () => {
      console.log('Fetching calculator config for id:', configId); // Debug log
      const response = await fetch(`/api/admin/calculator-configs/public/${configId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch calculator config:', errorText); // Debug log
        throw new Error(`Failed to fetch calculator configuration: ${errorText}`);
      }
      const data = await response.json();
      console.log('Received calculator config:', data); // Debug log
      return data;
    },
    enabled: !!configId,
  });

  useEffect(() => {
    // Notify parent frame of content height changes
    const sendHeight = () => {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'calculator-height',
          height: document.documentElement.scrollHeight
        }, '*');
      }
    };

    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, []);

  const calculateResults = (values: any) => {
    if (!config) return;

    const results: CalculationResults = {};
    config.formulas.forEach(formula => {
      let calculation = formula.formula;

      // Replace field placeholders with actual values
      Object.entries(values).forEach(([field, value]) => {
        calculation = calculation.replace(
          new RegExp(`\\{${field}\\}`, 'g'), 
          String(value)
        );
      });

      try {
        // Safely evaluate the formula
        results[formula.name] = eval(calculation);
      } catch (error) {
        console.error(`Error calculating ${formula.name}:`, error);
        results[formula.name] = 0;
      }
    });

    setResults(results);
  };

  const handleValuesChange = () => {
    const values = form.getFieldsValue();
    calculateResults(values);
  };

  if (error) {
    return (
      <Card>
        <Text type="danger">Error loading calculator: {(error as Error).message}</Text>
      </Card>
    );
  }

  if (isLoading) {
    return <Card loading />;
  }

  if (!config) {
    return (
      <Card>
        <Text type="warning">Calculator configuration not found</Text>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto my-4">
      <Title level={4}>{config.name}</Title>

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        {config.fields.map((field) => (
          <Form.Item
            key={field.name}
            name={field.name}
            label={field.label}
            rules={[{ required: true, message: `Please input ${field.label}` }]}
          >
            {field.type === 'number' ? (
              <InputNumber
                style={{ width: '100%' }}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                addonAfter={field.unit}
              />
            ) : (
              <Select
                placeholder={`Select ${field.label.toLowerCase()}`}
                options={field.options?.map(opt => ({ label: opt, value: opt }))}
              />
            )}
          </Form.Item>
        ))}
      </Form>

      {Object.keys(results).length > 0 && (
        <div className="mt-6 space-y-4">
          <Title level={5}>Results</Title>
          {config.formulas.map((formula) => (
            <div key={formula.name} className="flex justify-between items-center">
              <Text>{formula.name}:</Text>
              <Text strong>
                {typeof results[formula.name] === 'number'
                  ? results[formula.name].toFixed(2)
                  : 'N/A'}
              </Text>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}