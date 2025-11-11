import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
  Popconfirm,
  InputNumber,
  Slider,
  Avatar,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ShopOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import PageHeader from '@/components/PageHeader';
import { VendorLogoUpload } from '@/components/VendorLogoUpload';

const { Option } = Select;

interface VendorForm {
  name: string;
  services: string[];
  serviceAreas: string[];
  rating: number;
  certificationsAndCompliance: string[];
  onTimeRate: number;
  recyclingEfficiency: number;
  customerSatisfaction: number;
  connectionStatus: 'online' | 'offline' | 'maintenance';
  companyLogo?: string; // Added companyLogo field
}

export default function VendorManagement() {
  const [form] = Form.useForm<VendorForm>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['/api/admin/vendors'],
  });

  const createVendorMutation = useMutation({
    mutationFn: async (values: VendorForm) => {
      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Failed to create vendor');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      message.success('Vendor created successfully');
      setIsModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error('Failed to create vendor');
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: async (values: VendorForm & { id: number }) => {
      const { id, ...data } = values;
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update vendor');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      message.success('Vendor updated successfully');
      setIsModalVisible(false);
      setEditingVendor(null);
      form.resetFields();
    },
    onError: () => {
      message.error('Failed to update vendor');
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete vendor');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      message.success('Vendor deleted successfully');
    },
    onError: () => {
      message.error('Failed to delete vendor');
    },
  });

  const handleSubmit = (values: VendorForm) => {
    if (editingVendor) {
      updateVendorMutation.mutate({ ...values, id: editingVendor.id });
    } else {
      createVendorMutation.mutate(values);
    }
  };

  const handleEdit = (record: any) => {
    setEditingVendor(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: '',
      key: 'logo',
      width: 64,
      render: (record: any) => (
        <Avatar
          size={48}
          src={record.companyLogo ? `/uploads/vendor-logos/${record.companyLogo}` : null}
          icon={!record.companyLogo && <ShopOutlined />}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {record.companyLogo && (
            <img
              src={`/uploads/vendor-logos/${record.companyLogo}`}
              alt={`${record.name} logo`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          )}
        </Avatar>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Services',
      dataIndex: 'services',
      key: 'services',
      render: (services: string[]) => (
        <Space wrap>
          {services.map(service => (
            <Tag key={service}>{service}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Service Areas',
      dataIndex: 'serviceAreas',
      key: 'serviceAreas',
      render: (areas: string[]) => (
        <Space wrap>
          {areas.map(area => (
            <Tag key={area}>{area}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Connection Status',
      dataIndex: 'connectionStatus',
      key: 'connectionStatus',
      render: (status: string) => (
        <Tag color={status === 'online' ? 'success' : status === 'maintenance' ? 'warning' : 'default'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this vendor?"
            onConfirm={() => deleteVendorMutation.mutate(record.id)}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Vendor Management"
        subtitle="Manage vendor information and integrations"
      />

      <div className="mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingVendor(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          Add Vendor
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={vendors}
        loading={isLoading}
        rowKey="id"
      />

      <Modal
        title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingVendor(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            rating: 0,
            onTimeRate: 0,
            recyclingEfficiency: 0,
            customerSatisfaction: 0,
            connectionStatus: 'offline'
          }}
        >
          <Form.Item label="Company Logo">
            <VendorLogoUpload
              onUploadSuccess={(logoUrl) => {
                form.setFieldValue('companyLogo', logoUrl);
              }}
              currentLogo={editingVendor?.companyLogo}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter vendor name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="services"
            label="Services"
            rules={[{ required: true, message: 'Please select services' }]}
          >
            <Select mode="multiple">
              <Option value="General Waste">General Waste</Option>
              <Option value="Recyclables">Recyclables</Option>
              <Option value="Hazardous Waste">Hazardous Waste</Option>
              <Option value="Medical Waste">Medical Waste</Option>
              <Option value="Organic Waste">Organic Waste</Option>
              <Option value="Construction Waste">Construction Waste</Option>
              <Option value="E-Waste">E-Waste</Option>
              <Option value="Liquid Waste">Liquid Waste</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="serviceAreas"
            label="Service Areas"
            rules={[{ required: true, message: 'Please select service areas' }]}
          >
            <Select mode="multiple">
              <Option value="Sydney">Sydney</Option>
              <Option value="Melbourne">Melbourne</Option>
              <Option value="Brisbane">Brisbane</Option>
              <Option value="Perth">Perth</Option>
              <Option value="Adelaide">Adelaide</Option>
              <Option value="Gold Coast">Gold Coast</Option>
              <Option value="Newcastle">Newcastle</Option>
              <Option value="Canberra">Canberra</Option>
              <Option value="Hobart">Hobart</Option>
              <Option value="Darwin">Darwin</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="rating"
            label="Rating"
            rules={[{ required: true, message: 'Please enter rating' }]}
          >
            <InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="onTimeRate"
            label="On-Time Rate (%)"
            rules={[{ required: true, message: 'Please enter on-time rate' }]}
          >
            <Slider min={0} max={100} />
          </Form.Item>

          <Form.Item
            name="recyclingEfficiency"
            label="Recycling Efficiency (%)"
            rules={[{ required: true, message: 'Please enter recycling efficiency' }]}
          >
            <Slider min={0} max={100} />
          </Form.Item>

          <Form.Item
            name="customerSatisfaction"
            label="Customer Satisfaction (%)"
            rules={[{ required: true, message: 'Please enter customer satisfaction' }]}
          >
            <Slider min={0} max={100} />
          </Form.Item>

          <Form.Item
            name="certificationsAndCompliance"
            label="Certifications"
            rules={[{ required: true, message: 'Please select certifications' }]}
          >
            <Select mode="multiple">
              <Option value="ISO 14001">ISO 14001 Environmental Management</Option>
              <Option value="EPA Certified">EPA Certified</Option>
              <Option value="AS/NZS 4801">AS/NZS 4801 OHS Management</Option>
              <Option value="OHSAS 18001">OHSAS 18001</Option>
              <Option value="ISO 9001">ISO 9001 Quality Management</Option>
              <Option value="GECA">GECA Certified</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="connectionStatus"
            label="Connection Status"
            rules={[{ required: true, message: 'Please select connection status' }]}
          >
            <Select>
              <Option value="online">Online</Option>
              <Option value="offline">Offline</Option>
              <Option value="maintenance">Maintenance</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createVendorMutation.isPending || updateVendorMutation.isPending}
              >
                {editingVendor ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
}