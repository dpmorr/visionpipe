import { Card, Table, Tag, Typography, Tooltip } from 'antd';
import { TrophyOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';

const { Title } = Typography;

interface LeaderboardEntry {
  rank: number;
  companyName: string;
  sustainabilityScore: number;
  recyclingRate: number;
  wasteReduced: number;
  trend: 'up' | 'down' | 'stable';
  previousRank: number;
}

function SustainabilityLeaderboard() {
  const { data: leaderboardData, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard'],
  });

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      render: (rank: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {rank <= 3 && (
            <TrophyOutlined style={{ 
              color: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32',
              fontSize: '20px'
            }} />
          )}
          {rank}
        </div>
      ),
    },
    {
      title: 'Company',
      dataIndex: 'companyName',
      key: 'companyName',
    },
    {
      title: 'Sustainability Score',
      dataIndex: 'sustainabilityScore',
      key: 'sustainabilityScore',
      render: (score: number) => (
        <Tag color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'}>
          {score.toFixed(1)}
        </Tag>
      ),
      sorter: (a: LeaderboardEntry, b: LeaderboardEntry) => 
        a.sustainabilityScore - b.sustainabilityScore,
    },
    {
      title: 'Recycling Rate',
      dataIndex: 'recyclingRate',
      key: 'recyclingRate',
      render: (rate: number) => `${rate.toFixed(1)}%`,
    },
    {
      title: 'Waste Reduced',
      dataIndex: 'wasteReduced',
      key: 'wasteReduced',
      render: (amount: number) => `${amount.toFixed(1)} kg`,
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string, record: LeaderboardEntry) => {
        const renderTrend = () => {
          const rankChange = record.previousRank - record.rank;
          return (
            <span>
              {trend === 'up' ? (
                <RiseOutlined style={{ color: '#52c41a' }} />
              ) : trend === 'down' ? (
                <FallOutlined style={{ color: '#f5222d' }} />
              ) : (
                '−'
              )}
              {rankChange !== 0 && ` ${Math.abs(rankChange)}`}
            </span>
          );
        };

        return (
          <Tooltip title={`Previous rank: ${record.previousRank}`}>
            {renderTrend()}
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Card>
      <Title level={4}>
        <TrophyOutlined style={{ marginRight: 8 }} />
        Sustainability Leaderboard
      </Title>
      <Table
        dataSource={leaderboardData}
        columns={columns}
        loading={isLoading}
        pagination={false}
        rowKey="rank"
      />
    </Card>
  );
}

export default SustainabilityLeaderboard;
