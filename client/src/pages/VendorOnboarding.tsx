import { useState } from 'react';
import { Card, Steps, Form, Input, Select, Button, Upload, Space, Typography, message, InputNumber, DatePicker } from 'antd';
import { LoadingOutlined, PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PageHeader from '@/components/PageHeader';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function VendorOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const { toast } = useToast();

  const createVendor = useMutation({
    mutationFn: async (values: any) => {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create vendor profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor profile created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create vendor profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const steps = [
    {
      title: 'Company Profile',
      content: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Form.Item
            name="name"
            label="Company Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter your company name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Company Description"
            rules={[{ required: true }]}
          >
            <TextArea rows={4} placeholder="Describe your company and services" />
          </Form.Item>

          <Form.Item
            name="website"
            label="Company Website"
            rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item
            name="yearEstablished"
            label="Year Established"
            rules={[{ required: true }]}
          >
            <DatePicker picker="year" />
          </Form.Item>
        </Space>
      ),
    },
    {
      title: 'Services',
      content: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Form.Item
            name="services"
            label="Waste Management Services"
            rules={[{ required: true }]}
          >
            <Select mode="multiple" placeholder="Select services offered">
              <Option value="General Waste">General Waste</Option>
              <Option value="Recyclables">Recyclables</Option>
              <Option value="Hazardous">Hazardous Waste</Option>
              <Option value="E-waste">E-waste</Option>
              <Option value="Organic">Organic Waste</Option>
              <Option value="Construction">Construction Waste</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="specializations"
            label="Specializations"
            rules={[{ required: true }]}
          >
            <Select mode="multiple" placeholder="Select specializations">
              <Option value="Industrial">Industrial Waste</Option>
              <Option value="Medical">Medical Waste</Option>
              <Option value="Chemical">Chemical Waste</Option>
              <Option value="Electronic">Electronic Recycling</Option>
              <Option value="Food">Food Waste</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="processingCapacity"
            label="Processing Capacity (tons/month)"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        </Space>
      ),
    },
    {
      title: 'Certifications',
      content: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Form.Item
            name="certificationsAndCompliance"
            label="Certifications"
            rules={[{ required: true }]}
          >
            <Select mode="multiple" placeholder="Select certifications">
              <Option value="ISO14001">ISO 14001</Option>
              <Option value="LEED">LEED Certified</Option>
              <Option value="GreenSeal">Green Seal</Option>
              <Option value="EcoVadis">EcoVadis</Option>
              <Option value="OHSAS18001">OHSAS 18001</Option>
              <Option value="R2">R2 (Responsible Recycling)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="complianceDocuments"
            label="Compliance Documents"
          >
            <Upload
              listType="picture-card"
              maxCount={5}
              beforeUpload={() => false}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
        </Space>
      ),
    },
    {
      title: 'Contact Info',
      content: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Form.Item
            name={['contactInfo', 'email']}
            label="Email"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input placeholder="contact@example.com" />
          </Form.Item>

          <Form.Item
            name={['contactInfo', 'phone']}
            label="Phone"
            rules={[{ required: true }]}
          >
            <Input placeholder="+1 (555) 555-5555" />
          </Form.Item>

          <Form.Item
            name={['contactInfo', 'address']}
            label="Address"
            rules={[{ required: true }]}
          >
            <TextArea rows={3} placeholder="Enter your business address" />
          </Form.Item>
        </Space>
      ),
    },
    {
      title: 'Service Areas',
      content: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Form.Item
            name="serviceAreas"
            label="Service Areas"
            rules={[{ required: true }]}
          >
            <Select mode="multiple" placeholder="Select service areas">
              <Option value="North">North Region</Option>
              <Option value="South">South Region</Option>
              <Option value="East">East Region</Option>
              <Option value="West">West Region</Option>
              <Option value="Central">Central Region</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="pricing"
            label="Pricing Model"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select pricing model">
              <Option value="per_pickup">Per Pickup</Option>
              <Option value="monthly">Monthly Contract</Option>
              <Option value="weight_based">Weight-based</Option>
              <Option value="custom">Custom Quote</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="availabilitySchedule"
            label="Availability Schedule"
            rules={[{ required: true }]}
          >
            <Select mode="multiple" placeholder="Select availability">
              <Option value="weekdays">Weekdays</Option>
              <Option value="weekends">Weekends</Option>
              <Option value="24_7">24/7</Option>
              <Option value="custom">Custom Schedule</Option>
            </Select>
          </Form.Item>
        </Space>
      ),
    },
  ];

  const next = async () => {
    try {
      await form.validateFields();
      setCurrentStep(current => current + 1);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const prev = () => {
    setCurrentStep(current => current - 1);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      createVendor.mutate(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <div>
      <PageHeader
        title="Vendor Onboarding"
        subtitle="Complete the steps below to register as a waste management vendor"
      />

      <Card>
        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: 600, margin: '0 auto' }}
        >
          {steps[currentStep].content}

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            {currentStep > 0 && (
              <Button style={{ marginRight: 8 }} onClick={prev}>
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                Next
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button 
                type="primary" 
                onClick={handleSubmit}
                loading={createVendor.isPending}
              >
                Submit
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default VendorOnboarding;
