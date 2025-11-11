import { useState, useEffect } from 'react';
import { Card, Steps, Form, Input, Select, Button, Space, Typography, Tabs, Table, Tag, Modal, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, PlusCircleOutlined, ApiOutlined, EnvironmentOutlined, BookOutlined, SaveOutlined } from '@ant-design/icons';
import GooglePlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import { ReactFlowProvider } from 'reactflow';
import PageHeader from '@/components/PageHeader';
import FlowChart from '@/components/FlowChart';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface Sensor {
  id: number;
  name: string;
  type: string;
  lastReading?: number;
  lastReadingUnit?: string;
  location: string;
}

interface Location {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface WastePoint {
  id: number;
  process_step: string;
  wasteType: string;
  estimatedVolume: string;
  unit: string;
  vendor: string;
  notes: string;
  location?: string;
  locationData?: Location;
  sensorId?: number;
  sensor?: Sensor;
}

interface StoredLocation {
  id: number;
  name: string;
  address: string;
  placeId: string;
  lat: number;
  lng: number;
}

interface Vendor {
  id: number;
  name: string;
}

export default function BusinessProcessMaker() {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const { toast } = useToast();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingWastePoint, setEditingWastePoint] = useState<WastePoint | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  const [flowChartRef, setFlowChartRef] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [saveLocationModalVisible, setSaveLocationModalVisible] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [savedLocations, setSavedLocations] = useState<StoredLocation[]>([]);
  const [wastePointsData, setWastePointsData] = useState<WastePoint[]>([]);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        console.log('Google Maps is loaded and available');
        setIsGoogleMapsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) {
      return;
    }

    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const { data: vendors = [] as Vendor[] } = useQuery<Vendor[]>({
    queryKey: ['/api/vendors'],
  });

  const { data: wastePoints = [], isLoading: isLoadingWastePoints } = useQuery<WastePoint[]>({
    queryKey: ['/api/waste-points'],
  });
  useEffect(() => {
    setWastePointsData(wastePoints);
  }, [wastePoints]);
  const hasWastePoints = wastePoints.length > 0;

  const { data: sensors = [] } = useQuery<Sensor[]>({
    queryKey: ['/api/sensors'],
  });

  const { data: storedLocations = [] } = useQuery<StoredLocation[]>({
    queryKey: ['/api/stored-locations'],
  });

  const addWastePointMutation = useMutation({
    mutationFn: async (wastePoint: Omit<WastePoint, 'id'>) => {
      let locationData = null;

      if (selectedLocation) {
        const results = await geocodeByAddress(selectedLocation.label);
        const latLng = await getLatLng(results[0]);
        locationData = {
          address: selectedLocation.label,
          lat: latLng.lat,
          lng: latLng.lng,
          placeId: selectedLocation.value.place_id
        };
      }

      // Ensure estimatedVolume is string
      const estimatedVolume = String(wastePoint.estimatedVolume);

      const payload = {
        processStep: wastePoint.process_step,
        wasteType: wastePoint.wasteType,
        estimatedVolume,
        unit: wastePoint.unit,
        vendor: wastePoint.vendor,
        notes: wastePoint.notes,
        sensorId: wastePoint.sensorId ? Number(wastePoint.sensorId) : null,
        location: selectedLocation?.label,
        locationData
      };

      console.log('Adding waste point with payload:', payload);

      const res = await fetch('/api/waste-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to create waste point');
      }

      return res.json();
    },
    onSuccess: (data) => {
      form.resetFields();
      setSelectedLocation(null);
      toast({
        title: "Waste Point Added",
        description: `Successfully added waste point for ${data.process_step}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/waste-points'] });
    },
    onError: (error) => {
      console.error('Error adding waste point:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add waste point",
        variant: "destructive",
      });
    },
  });

  const updateWastePointMutation = useMutation({
    mutationFn: async (wastePoint: WastePoint) => {
      const payload = {
        ...wastePoint,
        estimatedVolume: String(wastePoint.estimatedVolume),
        sensorId: wastePoint.sensorId ? Number(wastePoint.sensorId) : null,
      };

      console.log('Updating waste point with payload:', payload);

      const res = await fetch(`/api/waste-points/${wastePoint.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to update waste point');
      }

      return res.json();
    },
    onSuccess: (data) => {
      setEditModalVisible(false);
      setEditingWastePoint(null);
      editForm.resetFields();
      toast({
        title: "Waste Point Updated",
        description: `Successfully updated waste point for ${data.process_step}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/waste-points'] });
    },
    onError: (error) => {
      console.error('Error updating waste point:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update waste point",
        variant: "destructive",
      });
    },
  });

  const deleteWastePointMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/waste-points/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete waste point');
    },
    onSuccess: () => {
      toast({
        title: "Waste Point Deleted",
        description: "Successfully deleted waste point",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/waste-points'] });
    },
  });

  const saveLocationMutation = useMutation({
    mutationFn: async (data: { name: string; location: any }) => {
      try {
        const results = await geocodeByAddress(data.location.label);
        const latLng = await getLatLng(results[0]);

        const payload = {
          name: data.name,
          address: data.location.label,
          placeId: data.location.value.place_id,
          lat: latLng.lat,
          lng: latLng.lng,
        };

        console.log('Sending location data:', payload);

        const res = await fetch('/api/stored-locations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error('Failed to save location');
        }

        return res.json();
      } catch (error) {
        console.error('Error in saveLocationMutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Location Saved",
        description: "Successfully saved location for quick access",
      });
      setSaveLocationModalVisible(false);
      setLocationName('');
      queryClient.invalidateQueries({ queryKey: ['/api/stored-locations'] });
    },
    onError: (error: any) => {
      console.error('Location save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save location",
        variant: "destructive",
      });
    }
  });


  const handleSubmit = (values: any) => {
    console.log('Submitting form with values:', values);
    addWastePointMutation.mutate(values);
  };

  const handleEdit = (record: WastePoint) => {
    console.log('Editing waste point:', record);
    setEditingWastePoint(record);
    editForm.setFieldsValue({
      ...record,
      sensorId: record.sensorId || undefined,
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      console.log('Edit form values:', values);
      if (editingWastePoint?.id) {
        await updateWastePointMutation.mutateAsync({
          ...values,
          id: editingWastePoint.id,
        });
      }
    } catch (error) {
      console.error('Validation failed:', error);
      toast({
        title: "Error",
        description: "Please check all required fields and try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveLocation = () => {
    if (!selectedLocation) {
      toast({
        title: "Error",
        description: "Please select a location first",
        variant: "destructive",
      });
      return;
    }
    if (!locationName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for this location",
        variant: "destructive",
      });
      return;
    }
    saveLocationMutation.mutate({ name: locationName, location: selectedLocation });
  };


  const addToFlowChart = (wastePoint: WastePoint) => {
    if (activeTab !== 'flow') {
      setActiveTab('flow');
    }

    const wastePointData = {
      id: wastePoint.id,
      process_step: wastePoint.process_step,
      wasteType: wastePoint.wasteType,
      estimatedVolume: wastePoint.estimatedVolume,
      unit: wastePoint.unit,
      vendor: wastePoint.vendor,
      notes: wastePoint.notes
    };

    if (flowChartRef) {
      flowChartRef(wastePointData);
    }
  };

  const columns = [
    {
      title: 'Process Step',
      dataIndex: 'process_step',
      key: 'process_step',
    },
    {
      title: 'Waste Type',
      dataIndex: 'wasteType',
      key: 'wasteType',
      render: (type: string) => (
        <Tag color={
          type === 'Hazardous' ? '#04a2fe' :
            type === 'Recyclable' ? '#04a2fe' :
              '#04a2fe'
        }>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Volume',
      key: 'volume',
      render: (record: WastePoint) => `${record.estimatedVolume} ${record.unit}`,
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    {
      title: 'Sensor',
      key: 'sensor',
      render: (record: WastePoint) => (
        record.sensor ? (
          <Tooltip title={`Last reading: ${record.sensor.lastReading} ${record.sensor.lastReadingUnit}`}>
            <Tag icon={<ApiOutlined />} color="#04a2fe">
              {record.sensor.name} ({record.sensor.type})
            </Tag>
          </Tooltip>
        ) : (
          <Tag icon={<ApiOutlined />} color="#04a2fe">No sensor</Tag>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: WastePoint) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            icon={<PlusCircleOutlined />}
            onClick={() => addToFlowChart(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteWastePointMutation.mutate(record.id.toString())}
            loading={deleteWastePointMutation.isPending}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Process Flow Maker"
        subtitle="Map your business processes and visualize waste points"
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Facility" key="facility">
          <Card>
            {hasWastePoints ? (
              <ReactFlowProvider>
                <FlowChart wastePoints={wastePoints} />
              </ReactFlowProvider>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Text type="secondary">
                  Please add at least one waste point before accessing the process flow.
                </Text>
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>

      <Card title="Waste Points List" className="mt-8">
        <Table
          dataSource={wastePoints}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title="Edit Waste Point"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingWastePoint(null);
          editForm.resetFields();
        }}
        confirmLoading={updateWastePointMutation.isPending}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            name="process_step"
            label="Process Step"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g., Manufacturing, Packaging, Storage" />
          </Form.Item>

          <Form.Item
            name="wasteType"
            label="Waste Type"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select waste type">
              <Select.Option value="Hazardous">Hazardous</Select.Option>
              <Select.Option value="Recyclable">Recyclable</Select.Option>
              <Select.Option value="General">General</Select.Option>
            </Select>
          </Form.Item>

          <Space>
            <Form.Item
              name="estimatedVolume"
              label="Estimated Volume"
              rules={[{ required: true }]}
            >
              <Input type="number" style={{ width: 200 }} />
            </Form.Item>

            <Form.Item
              name="unit"
              label="Unit"
              rules={[{ required: true }]}
            >
              <Select style={{ width: 100 }}>
                <Select.Option value="kg">kg</Select.Option>
                <Select.Option value="tons">tons</Select.Option>
                <Select.Option value="liters">liters</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item
            name="vendor"
            label="Assign Vendor"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select vendor"
              showSearch
              optionFilterProp="children"
            >
              {vendors?.map((vendor: any) => (
                <Select.Option key={vendor.id} value={vendor.name}>
                  {vendor.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="sensorId"
            label="Connect Sensor"
          >
            <Select
              placeholder="Select a sensor for live data"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {sensors?.map((sensor: any) => (
                <Select.Option
                  key={sensor.id}
                  value={sensor.id}
                >
                  {sensor.name} ({sensor.type}) - {sensor.location}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={3} placeholder="Add any additional notes about this waste point" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Save Location"
        open={saveLocationModalVisible}
        onOk={handleSaveLocation}
        onCancel={() => {
          setSaveLocationModalVisible(false);
          setLocationName('');
        }}
        confirmLoading={saveLocationMutation.isPending}
      >
        <Form layout="vertical">
          <Form.Item
            label="Location Name"
            required
          >
            <Input
              placeholder="Enter a name for this location"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </Form.Item>
          <div className="text-gray-500">
            Saving: {selectedLocation?.label}
          </div>
        </Form>
      </Modal>
    </div>
  );
}