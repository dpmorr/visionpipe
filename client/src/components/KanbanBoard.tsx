import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useDraggable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { SelectInitiative } from "@db/schema";

interface Props {
  initiatives: SelectInitiative[];
  onUpdateStatus: (initiativeId: number, newStatus: string) => void;
  onSelectInitiative: (initiative: SelectInitiative) => void;
}

const statusColors: Record<string, string> = {
  planning: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800"
};

const columnBackgrounds: Record<string, string> = {
  planning: "bg-yellow-100",
  active: "bg-green-100",
  completed: "bg-blue-100",
  cancelled: "bg-red-100"
};

function DraggableInitiativeCard({ 
  initiative, 
  onSelect 
}: { 
  initiative: SelectInitiative;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: initiative.id.toString(),
    data: initiative
  });

  const progress = initiative.status === 'completed' ? 100 :
                  initiative.status === 'active' ? 50 :
                  initiative.status === 'planning' ? 25 : 0;

  if (isDragging) {
    return <div ref={setNodeRef} />;
  }

  return (
    <div 
      ref={setNodeRef} 
      {...attributes} 
      {...listeners}
      onClick={(e) => {
        if (!isDragging) {
          onSelect();
        }
      }}
    >
      <Card className="p-4 mb-3 cursor-move hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium line-clamp-2">{initiative.title}</h4>
          <Badge className={statusColors[initiative.status]}>
            {initiative.status}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {initiative.description}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="text-gray-700 font-medium">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </Card>
    </div>
  );
}

function DroppableColumn({ 
  id,
  title, 
  initiatives,
  onSelectInitiative 
}: { 
  id: string;
  title: string;
  initiatives: SelectInitiative[];
  onSelectInitiative: (initiative: SelectInitiative) => void;
}) {
  const { setNodeRef } = useDroppable({
    id
  });

  return (
    <div 
      ref={setNodeRef}
      className={`p-4 rounded-lg ${columnBackgrounds[id]} min-h-[500px]`}
    >
      <h3 className="text-lg font-medium mb-4 capitalize">{title}</h3>
      <div className="space-y-3">
        {initiatives.map(initiative => (
          <DraggableInitiativeCard
            key={initiative.id}
            initiative={initiative}
            onSelect={() => onSelectInitiative(initiative)}
          />
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard({ initiatives, onUpdateStatus, onSelectInitiative }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeInitiative = activeId ? 
    initiatives.find(i => i.id.toString() === activeId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const columns = [
    { id: 'planning', title: 'Planning', initiatives: initiatives.filter(i => i.status === 'planning') },
    { id: 'active', title: 'Active', initiatives: initiatives.filter(i => i.status === 'active') },
    { id: 'completed', title: 'Completed', initiatives: initiatives.filter(i => i.status === 'completed') },
    { id: 'cancelled', title: 'Cancelled', initiatives: initiatives.filter(i => i.status === 'cancelled') }
  ];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const initiativeId = parseInt(active.id.toString());
    const newStatus = over.id.toString();

    // Find the initiative being dragged
    const initiative = initiatives.find(i => i.id === initiativeId);

    // Only update if dropping into a different status
    if (initiative && initiative.status !== newStatus) {
      onUpdateStatus(initiativeId, newStatus);
    }

    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-4 gap-4">
        {columns.map(column => (
          <DroppableColumn
            key={column.id}
            id={column.id}
            title={column.title}
            initiatives={column.initiatives}
            onSelectInitiative={onSelectInitiative}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId && activeInitiative && (
          <Card className="p-4 mb-3 opacity-50 w-[calc(100%-2rem)] max-w-sm">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium line-clamp-2">{activeInitiative.title}</h4>
              <Badge className={statusColors[activeInitiative.status]}>
                {activeInitiative.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {activeInitiative.description}
            </p>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}