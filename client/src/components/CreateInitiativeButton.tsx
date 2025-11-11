import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

interface CreateInitiativeButtonProps {
  sourceType: 'analytics' | 'recycling';
  sourceReference: string;
  suggestionData: any;
  buttonText?: string;
}

export default function CreateInitiativeButton({ 
  sourceType, 
  sourceReference, 
  suggestionData,
  buttonText = "Create Initiative"
}: CreateInitiativeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createInitiative = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/initiatives/from-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceType,
          sourceReference,
          suggestionData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create initiative');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      toast({
        title: "Success",
        description: "Initiative created successfully. View it in the Project Management tab.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create initiative. Please try again.",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const handleClick = async () => {
    setIsLoading(true);
    createInitiative.mutate();
  };

  return (
    <Button 
      onClick={handleClick} 
      disabled={isLoading}
      variant="secondary"
      size="sm"
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {buttonText}
    </Button>
  );
}
