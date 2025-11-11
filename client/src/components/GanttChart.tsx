import { useState, useMemo, useCallback } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { type SelectInitiative } from "@db/schema";

interface TaskView {
  id: number;
  title: string;
  start: Date;
  end: Date;
  status: string;
  allDay: boolean;
}

const localizer = momentLocalizer(moment);

const statusColors = {
  planning: '#f59e0b',
  active: '#37b5fe',
  completed: '#3b82f6',
  cancelled: '#ef4444'
};

export default function GanttChart({ 
  tasks, 
  onTaskUpdate,
  onSelectTask 
}: { 
  tasks: SelectInitiative[]; 
  onTaskUpdate?: (taskId: number, updates: Partial<SelectInitiative>) => void;
  onSelectTask?: (task: SelectInitiative) => void;
}) {
  const [view, setView] = useState('month');
  const [isDragging, setIsDragging] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredEvents = useMemo(() => {
    const filtered = statusFilter === 'all' 
      ? tasks 
      : tasks.filter(task => task.status === statusFilter);

    return filtered.map(task => ({
      id: task.id,
      title: task.title,
      start: new Date(task.startDate),
      end: new Date(task.targetDate),
      status: task.status,
      allDay: true,
    }));
  }, [tasks, statusFilter]);

  const handleEventDrop = useCallback((info: any) => {
    const { event, start, end } = info;
    if (onTaskUpdate && event?.id) {
      onTaskUpdate(event.id, {
        startDate: moment(start).format('YYYY-MM-DD'),
        targetDate: moment(end || start).format('YYYY-MM-DD')
      });
    }
  }, [onTaskUpdate]);

  const handleEventResize = useCallback((info: any) => {
    const { event, start, end } = info;
    if (onTaskUpdate && event?.id) {
      onTaskUpdate(event.id, {
        startDate: moment(start).format('YYYY-MM-DD'),
        targetDate: moment(end).format('YYYY-MM-DD')
      });
    }
  }, [onTaskUpdate]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSelectEvent = useCallback((event: TaskView) => {
    if (!onSelectTask) return;

    const task = tasks.find(t => t.id === event.id);
    if (task) {
      onSelectTask(task);
    }
  }, [tasks, onSelectTask]);

  const eventStyleGetter = useCallback((event: TaskView) => {
    const isSelected = isDragging;

    const style = {
      backgroundColor: statusColors[event.status as keyof typeof statusColors] || '#3b82f6',
      borderRadius: '4px',
      opacity: isSelected ? 0.5 : 0.8,
      color: 'white',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: isSelected ? '0 0 0 2px rgba(99, 102, 241, 0.4)' : 'none',
    };
    return { style };
  }, [isDragging]);

  const Event = ({ event }: { event: TaskView }) => (
    <div className="flex items-center justify-between p-1">
      <span className="font-medium truncate">{event.title}</span>
      <Badge variant="outline" className="bg-white/90 text-xs">
        {event.status}
      </Badge>
    </div>
  );

  return (
    <Card className="p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Label>Filter by Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-[calc(100vh-20rem)]">
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.MONTH}
          views={['month', 'week', 'day']}
          step={60}
          selectable
          draggable
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          components={{
            event: Event
          }}
          popup
          style={{
            height: '100%',
          }}
        />
      </div>
    </Card>
  );
}