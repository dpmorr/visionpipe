import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ChecklistItem {
  id: number;
  title: string;
  description: string;
  link: string;
  completed: boolean;
}

export default function HomeOnboarding() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 1,
      title: "Connect waste vendors",
      description: "Set up connections with your waste management vendors",
      link: "/suppliers",
      completed: false,
    },
    {
      id: 2,
      title: "Set up sensors & integrations",
      description: "Connect your IoT sensors and third-party integrations",
      link: "/sensors",
      completed: false,
    },
    {
      id: 3,
      title: "Set up waste points",
      description: "Configure your waste collection points and routes",
      link: "/waste-points",
      completed: false,
    },
    {
      id: 4,
      title: "Start analysis",
      description: "Begin analyzing your waste management data",
      link: "/analytics",
      completed: false,
    },
  ]);

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;

  // Set default collapsed state when all items are completed
  useEffect(() => {
    console.log(`Onboarding status: ${completedCount}/${totalCount} completed`);
    if (completedCount === totalCount) {
      console.log('All tasks completed, collapsing section');
      setIsOpen(false);
    }
  }, [completedCount, totalCount]);

  const toggleComplete = (id: number) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome to wastetraq</h1>
        <p className="text-white/90 mt-2">
          Let's get your sustainability management system set up. Follow these steps to get started:
        </p>
      </div>

      <div className="grid gap-6">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <Card className="p-6 bg-white/90 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Onboarding Progress</h2>
                <span className="text-sm text-gray-600">
                  {completedCount} of {totalCount} completed
                </span>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="space-y-6">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <button
                    onClick={() => toggleComplete(item.id)}
                    className="mt-1 hover:opacity-70 transition-opacity"
                    aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.description}
                    </p>
                    <Button
                      variant="link"
                      className="text-sm p-0 h-auto text-teal-600 hover:text-teal-700 hover:underline"
                      onClick={() => setLocation(item.link)}
                    >
                      {item.completed ? "View setup" : "Start setup"} →
                    </Button>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}