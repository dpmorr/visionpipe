import { useState } from 'react';
import { Card, Steps, Button, Space, Typography, Alert, Radio, Progress, Modal } from 'antd';
import { BookOutlined, TrophyOutlined, BulbOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const { Title, Text, Paragraph } = Typography;

interface Scenario {
  id: number;
  title: string;
  description: string;
  options: {
    text: string;
    impact: number;
    feedback: string;
  }[];
  correctOption: number;
  explanation: string;
  category: 'waste' | 'recycling' | 'circular' | 'compliance';
  animation?: {
    type: 'sort' | 'process' | 'cycle';
    elements: string[];
  };
}

function TrainingSimulator() {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();

  const { data: scenarios = [] } = useQuery<Scenario[]>({
    queryKey: ['/api/training/scenarios'],
  });

  const submitAnswer = useMutation({
    mutationFn: async (answer: { scenarioId: number; selectedOption: number }) => {
      const response = await fetch('/api/training/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answer)
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setScore(prev => prev + data.points);
      setShowFeedback(true);
      toast({
        title: data.correct ? "Correct Answer!" : "Learning Opportunity",
        description: data.feedback,
        variant: data.correct ? "default" : "destructive"
      });
    }
  });

  const handleSubmit = () => {
    if (selectedOption === null) return;

    submitAnswer.mutate({
      scenarioId: scenarios[currentScenario].id,
      selectedOption
    });
  };

  const handleNext = () => {
    setCurrentScenario(prev => prev + 1);
    setSelectedOption(null);
    setShowFeedback(false);
  };

  const currentProgress = ((currentScenario + 1) / scenarios.length) * 100;

  const renderAnimation = (animation?: Scenario['animation']) => {
    if (!animation) return null;

    switch (animation.type) {
      case 'sort':
        return (
          <div className="flex justify-center items-center gap-4 my-6">
            {animation.elements.map((element, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.2 }}
                className="p-4 bg-primary/10 rounded-lg shadow-sm"
              >
                {element}
              </motion.div>
            ))}
          </div>
        );
      case 'process':
        return (
          <div className="flex justify-center items-center my-6">
            {animation.elements.map((element, index) => (
              <motion.div
                key={index}
                className="flex items-center"
              >
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.3 }}
                  className="p-4 bg-primary/10 rounded-lg shadow-sm"
                >
                  {element}
                </motion.div>
                {index < animation.elements.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.3 + 0.15 }}
                    className="w-8 h-0.5 bg-primary/30 mx-2"
                  />
                )}
              </motion.div>
            ))}
          </div>
        );
      case 'cycle':
        return (
          <div className="relative h-48 my-6">
            {animation.elements.map((element, index) => {
              const angle = (index * 2 * Math.PI) / animation.elements.length;
              const radius = 80;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    rotate: 360,
                    transition: {
                      rotate: {
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                      },
                      opacity: {
                        duration: 0.5,
                        delay: index * 0.2
                      }
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className="p-3 bg-primary/10 rounded-full shadow-sm"
                >
                  {element}
                </motion.div>
              );
            })}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHeader
        title="Sustainability Training Simulator"
        subtitle="Learn and practice sustainable waste management through interactive scenarios"
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div className="flex justify-between items-center mb-4">
              <Title level={4}>
                <BookOutlined className="mr-2" />
                Training Progress
              </Title>
              <Space>
                <TrophyOutlined className="text-yellow-500" />
                <Text strong>Score: {score}</Text>
              </Space>
            </div>
            <Progress percent={currentProgress} status="active" />
          </Space>
        </Card>

        {scenarios[currentScenario] && (
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Alert
                message={scenarios[currentScenario].title}
                description={scenarios[currentScenario].description}
                type="info"
                showIcon
              />

              {renderAnimation(scenarios[currentScenario].animation)}

              <Radio.Group
                onChange={e => setSelectedOption(e.target.value)}
                value={selectedOption}
                disabled={showFeedback}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {scenarios[currentScenario].options.map((option, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Radio value={index}>
                        {option.text}
                      </Radio>
                    </motion.div>
                  ))}
                </Space>
              </Radio.Group>

              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Alert
                      message={
                        <Space>
                          {selectedOption === scenarios[currentScenario].correctOption ? (
                            <CheckCircleOutlined className="text-green-500" />
                          ) : (
                            <CloseCircleOutlined className="text-red-500" />
                          )}
                          {selectedOption === scenarios[currentScenario].correctOption
                            ? "Correct Choice!"
                            : "Learning Opportunity"}
                        </Space>
                      }
                      description={scenarios[currentScenario].explanation}
                      type={
                        selectedOption === scenarios[currentScenario].correctOption
                          ? "success"
                          : "warning"
                      }
                      showIcon
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end gap-2">
                {!showFeedback ? (
                  <Button
                    type="primary"
                    onClick={handleSubmit}
                    disabled={selectedOption === null}
                    loading={submitAnswer.isPending}
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={handleNext}
                    disabled={currentScenario >= scenarios.length - 1}
                  >
                    Next Scenario
                  </Button>
                )}
              </div>
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
}

export default TrainingSimulator;