import { Typography, Space } from 'antd';
import { ReactNode } from 'react';

const { Title, Text } = Typography;

interface CustomPageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode[];
}

function CustomPageHeader({ title, subtitle, extra }: CustomPageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <Space direction="vertical" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>{title}</Title>
        {subtitle && <Text type="secondary">{subtitle}</Text>}
      </Space>
      {extra && <div className="flex gap-2">{extra}</div>}
    </div>
  );
}

export default CustomPageHeader;