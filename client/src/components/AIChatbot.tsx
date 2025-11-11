import { useState } from 'react';
import { Button, Card, Input, List, Avatar, Space, Tooltip } from 'antd';
import { MessageSquare, MinimizeIcon, Loader2, SendHorizontal } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useUser();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          context: {
            userId: user?.id,
            organizationId: user?.organizationId
          }
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    chatMutation.mutate(input);
    setInput('');
  };

  if (!isOpen) {
    return (
      <Tooltip title="AI Sustainability Advisor">
        <Button
          type="primary"
          shape="circle"
          size="large"
          className="fixed bottom-6 right-6 w-14 h-14 shadow-lg z-50"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </Tooltip>
    );
  }

  return (
    <Card 
      className="fixed bottom-6 right-6 w-96 shadow-lg z-50" 
      bodyStyle={{ padding: '12px' }}
      title={
        <div className="flex justify-between items-center">
          <span>AI Sustainability Advisor</span>
          <Button 
            type="text" 
            icon={<MinimizeIcon className="w-4 h-4" />} 
            onClick={() => setIsOpen(false)}
          />
        </div>
      }
    >
      <div className="flex flex-col h-[400px]">
        <List
          className="flex-1 overflow-auto mb-4"
          itemLayout="horizontal"
          dataSource={messages}
          renderItem={(message) => (
            <List.Item className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} border-0`}>
              <div className={`flex items-start gap-2 max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {message.role === 'assistant' && (
                  <Avatar style={{ backgroundColor: '#1890ff', flexShrink: 0 }}>AI</Avatar>
                )}
                <div
                  className={`px-4 py-2 rounded-lg break-words ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white ml-2'
                      : 'bg-gray-100 text-gray-800 mr-2'
                  }`}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <Avatar style={{ backgroundColor: '#87d068', flexShrink: 0 }}>
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                )}
              </div>
            </List.Item>
          )}
        />
        <div className="flex gap-2">
          <Input
            placeholder="Ask about sustainability..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={handleSend}
            disabled={chatMutation.isPending}
          />
          <Button
            type="primary"
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
          >
            {chatMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SendHorizontal className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}