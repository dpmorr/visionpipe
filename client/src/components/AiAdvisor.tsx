import { useState } from 'react';
import { Card, Input, Button, List, Avatar, Typography, Spin } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SendOutlined, RobotOutlined } from '@ant-design/icons';
import { toast } from '@/hooks/use-toast';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function AiAdvisor() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Hello! I\'m your AI sustainability advisor. I can help you optimize your waste management practices and provide personalized recommendations. What would you like to know about?',
    timestamp: new Date().toISOString()
  }]);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: messages })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get advisor response');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      }]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get advisor response. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }]);

    sendMessage.mutate(input);
    setInput('');
  };

  return (
    <Card title={
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <RobotOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
        <Title level={4} style={{ margin: 0 }}>AI Sustainability Advisor</Title>
      </div>
    }>
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
        <List
          className="message-list"
          style={{
            overflowY: 'auto',
            flex: 1,
            marginBottom: '16px'
          }}
          itemLayout="horizontal"
          dataSource={messages}
          renderItem={(message) => (
            <List.Item style={{
              flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
              padding: '8px'
            }}>
              <List.Item.Meta
                avatar={
                  message.role === 'assistant' ? 
                    <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} /> :
                    <Avatar style={{ backgroundColor: '#87d068' }}>{message.role[0].toUpperCase()}</Avatar>
                }
                content={
                  <div style={{
                    backgroundColor: message.role === 'user' ? '#f0f2f5' : '#e6f7ff',
                    padding: '12px',
                    borderRadius: '8px',
                    maxWidth: '80%',
                    marginLeft: message.role === 'user' ? 'auto' : '0'
                  }}>
                    <Text>{message.content}</Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about waste reduction strategies..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sendMessage.isPending}
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default AiAdvisor;
