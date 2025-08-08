import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCard } from '../hooks/useKanban';
import type { CreateCardInput, Priority } from '../api/client';

interface AddCardFormProps {
  boardId: string;
  columnId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData extends Omit<CreateCardInput, 'columnId' | 'labels'> {
  labelsInput: string;
}

export function AddCardForm({ boardId, columnId, isOpen, onClose }: AddCardFormProps) {
  const createCard = useCreateCard(boardId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      assignee: '',
      dueDate: '',
      labelsInput: '',
      priority: 'medium',
    },
  });

  const priority = watch('priority');

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const labels = data.labelsInput
        ? data.labelsInput.split(',').map(label => label.trim()).filter(Boolean)
        : [];

      await createCard.mutateAsync({
        columnId,
        title: data.title,
        description: data.description || undefined,
        assignee: data.assignee || undefined,
        dueDate: data.dueDate || undefined,
        labels,
        priority: data.priority,
      });

      reset();
      onClose();
    } catch (error) {
      console.error('Failed to create card:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="Enter card title"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter card description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                {...register('assignee')}
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={(value) => setValue('priority', value as Priority)}
            >
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="labels">Labels</Label>
            <Input
              id="labels"
              {...register('labelsInput')}
              placeholder="Enter labels separated by commas (e.g., bug, feature, urgent)"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple labels with commas
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}