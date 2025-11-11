import { useState } from 'react';
import { Card, Table, Tag, Space, Avatar, Typography, Progress, List, Tooltip, Button } from 'antd';
import { TrophyOutlined, StarOutlined, FireOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';

const { Title, Text } = Typography;

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  companyName: string;
  totalPoints: number;
  accuracy: number;
  correctSorts: number;
  totalAttempts: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
}

interface Achievement {
  title: string;
  description: string;
  earnedAt: string;
}

function WasteSortingLeaderboard() {
  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/waste-sorting'],
  });

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <Space>
          {rank <= 3 && (
            <TrophyOutlined style={{ 
              color: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32',
              fontSize: '20px'
            }} />
          )}
          {rank}
        </Space>
      ),
    },
    {
      title: 'User',
      dataIndex: 'username',
      key: 'username',
      render: (_: string, record: LeaderboardEntry) => (
        <Space>
          <Avatar>{record.username[0].toUpperCase()}</Avatar>
          <Space direction="vertical" size={0}>
            <Text strong>{record.username}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.companyName}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'totalPoints',
      key: 'totalPoints',
      sorter: (a: LeaderboardEntry, b: LeaderboardEntry) => a.totalPoints - b.totalPoints,
      render: (points: number) => (
        <Tag color="blue" icon={<StarOutlined />}>
          {points} pts
        </Tag>
      ),
    },
    {
      title: 'Accuracy',
      dataIndex: 'accuracy',
      key: 'accuracy',
      sorter: (a: LeaderboardEntry, b: LeaderboardEntry) => a.accuracy - b.accuracy,
      render: (accuracy: number) => (
        <Tooltip title={`${accuracy.toFixed(1)}% accuracy`}>
          <Progress
            percent={accuracy}
            size="small"
            status={accuracy >= 80 ? "success" : accuracy >= 60 ? "normal" : "exception"}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Streak',
      key: 'streak',
      render: (_: any, record: LeaderboardEntry) => (
        <Tooltip title={`Longest streak: ${record.longestStreak}`}>
          <Tag color="orange" icon={<FireOutlined />}>
            {record.currentStreak} day streak
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Achievements',
      key: 'achievements',
      render: (_: any, record: LeaderboardEntry) => (
        <Space>
          {record.achievements.map((achievement, index) => (
            <Tooltip key={index} title={`${achievement.title}: ${achievement.description}`}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
            </Tooltip>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <TrophyOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>Waste Sorting Champions</Title>
        </Space>

        <Table
          dataSource={leaderboard}
          columns={columns}
          loading={isLoading}
          rowKey="userId"
          pagination={{
            pageSize: 10,
            position: ['bottomCenter'],
            showSizeChanger: false
          }}
        />

        {leaderboard.length > 0 && (
          <Card 
            size="small" 
            title={<Text strong>Top Achievers This Week</Text>}
            style={{ marginTop: 16 }}
          >
            <List
              size="small"
              dataSource={leaderboard.slice(0, 3)}
              renderItem={item => (
                <List.Item>
                  <Space>
                    <Avatar style={{ backgroundColor: '#1890ff' }}>
                      {item.rank}
                    </Avatar>
                    <Text>{item.username}</Text>
                    <Tag color="gold">{item.totalPoints} points</Tag>
                    {item.currentStreak >= 5 && (
                      <Tag icon={<FireOutlined />} color="volcano">
                        {item.currentStreak} day streak
                      </Tag>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}
      </Space>
    </Card>
  );
}

export default WasteSortingLeaderboard;
