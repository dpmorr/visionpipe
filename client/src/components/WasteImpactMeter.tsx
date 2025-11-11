import { Card, Progress, Typography, Space, Grid, Row, Col, Statistic } from 'antd';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;

interface WasteImpactMeterProps {
  carbonScore: number;
  previousScore?: number;
  totalEmissions?: number;
  recyclingOffset?: number;
  netImpact?: number;
  carbonOffset?: number;
  waterSaved?: number;
  airQualityImpact?: number;
}

function WasteImpactMeter({ 
  carbonScore, 
  previousScore,
  totalEmissions = 0,
  recyclingOffset = 0,
  netImpact = 0,
  carbonOffset = 0,
  waterSaved = 0,
  airQualityImpact = 100
}: WasteImpactMeterProps) {
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Animate the score from 0 or previous score to the current score
    const startValue = previousScore || 0;
    const steps = 60; // Number of steps in animation
    const increment = (carbonScore - startValue) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      if (currentStep < steps) {
        setScore(prev => prev + increment);
        currentStep++;
      } else {
        setScore(carbonScore);
        clearInterval(timer);
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [carbonScore, previousScore]);

  const getColorForScore = (score: number) => {
    if (score <= 30) return '#52c41a'; // Green
    if (score <= 70) return '#faad14'; // Yellow
    return '#f5222d'; // Red
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ textAlign: 'center' }}>
          <Title level={4}>Carbon Impact Score</Title>
          <div style={{ padding: '20px 0' }}>
            <Progress
              type="dashboard"
              percent={Math.round(score)}
              strokeColor={getColorForScore(score)}
              strokeWidth={10}
              format={percent => (
                <Space direction="vertical" size={0}>
                  <Title level={2} style={{ margin: 0, color: getColorForScore(score) }}>
                    {percent}
                  </Title>
                  <Text type="secondary">Impact Score</Text>
                </Space>
              )}
            />
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Statistic
              title="Total Emissions"
              value={totalEmissions}
              precision={1}
              suffix="kg CO₂"
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Recycling Offset"
              value={recyclingOffset}
              precision={1}
              suffix="kg CO₂"
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Net Impact"
              value={netImpact}
              precision={1}
              suffix="kg CO₂"
              valueStyle={{ color: netImpact > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Carbon Offset"
              value={carbonOffset}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Water Saved"
              value={waterSaved}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Air Quality Impact"
              value={airQualityImpact}
              precision={1}
              suffix="%"
              valueStyle={{ color: airQualityImpact > 80 ? '#3f8600' : '#cf1322' }}
            />
          </Col>
        </Row>

        <Text type="secondary">
          {score <= 30
            ? "Great! Your carbon impact is low."
            : score <= 70
            ? "Moderate impact. Room for improvement."
            : "High impact. Consider reduction strategies."}
        </Text>
      </Space>
    </Card>
  );
}

export default WasteImpactMeter;