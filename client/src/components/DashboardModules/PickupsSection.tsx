import { Card, Space, List, Tag, Typography } from 'antd';
import { CalendarOutlined, MoreOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Pickup {
  id: string;
  date: string;
  type: string;
  status: string;
  location: string;
}

interface PickupsSectionProps {
  isPreview?: boolean;
  upcomingPickups: Pickup[];
}

export function PickupsSection({ isPreview = false, upcomingPickups }: PickupsSectionProps) {
  return (
    <Card
      title={
        <Space>
          <CalendarOutlined />
          <span>Upcoming Pickups</span>
        </Space>
      }
      extra={!isPreview && <MoreOutlined />}
      className="pickups-card"
    >
      <List
        dataSource={upcomingPickups}
        renderItem={(pickup) => (
          <List.Item
            key={pickup.id}
            actions={[
              <Tag color={pickup.status === 'scheduled' ? 'blue' : 'green'}>
                {pickup.status}
              </Tag>,
            ]}
          >
            <List.Item.Meta
              title={pickup.type}
              description={
                <Space direction="vertical" size={0}>
                  <Text type="secondary">{pickup.date}</Text>
                  <Text type="secondary">{pickup.location}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
