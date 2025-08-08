import { useCallback, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from '@/components/ui/kibo-ui/kanban';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useKanbanBoard } from '../state/useKanbanBoard';
import type { Card, Column } from '../api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface BoardProps {
  boardId: string;
  onCreateCard?: (columnId: string) => void;
  onEditCard?: (card: Card) => void;
  onEditColumn?: (column: Column) => void;
  onDeleteColumn?: (columnId: string) => void;
}

// Transform Card to match kibo-ui's expected format
interface KanbanItem {
  id: string;
  name: string;
  column: string;
  // Keep original card data for rendering
  originalCard: Card;
  [key: string]: unknown;
}

export function Board({
  boardId,
  onCreateCard,
  onEditCard,
  onEditColumn,
  onDeleteColumn,
}: BoardProps) {
  const handleError = useCallback((err: Error) => {
    console.error('Kanban board error:', err);
  }, []);

  const {
    columns,
    cards,
    isLoading,
    error,
    handleDragEnd: handleOptimisticDragEnd,
  } = useKanbanBoard({
    boardId,
    onError: handleError,
    maxRetries: 3,
    retryDelay: 1000,
  });

  // Transform data to match kibo-ui format
  const kanbanData = useMemo(() => {
    const sortedColumns = columns
      .sort((a, b) => a.position - b.position)
      .map(col => ({
        id: col.id,
        name: col.name,
        originalColumn: col,
      }));

    const items: KanbanItem[] = cards.map(card => ({
      id: card.id,
      name: card.title,
      column: card.columnId,
      originalCard: card,
    }));

    return { columns: sortedColumns, items };
  }, [columns, cards]);

  // Handle drag end event
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const activeCard = kanbanData.items.find(item => item.id === active.id);
      const overCard = kanbanData.items.find(item => item.id === over.id);
      const overColumn = kanbanData.columns.find(col => col.id === over.id);

      if (!activeCard) return;

      // Determine target column
      let targetColumnId: string | null = null;
      
      if (overCard) {
        targetColumnId = overCard.column;
      } else if (overColumn) {
        targetColumnId = overColumn.id;
      }

      try {
        await handleOptimisticDragEnd(
          active.id as string,
          over.id as string,
          activeCard.column,
          targetColumnId
        );
        
        // Show success feedback for significant moves
        if (activeCard.column !== targetColumnId) {
          const targetColumnName = kanbanData.columns.find(c => c.id === targetColumnId)?.name;
          toast.success(`Moved "${activeCard.originalCard.title}" to ${targetColumnName}`);
        }
      } catch (error) {
        // Error is already handled by useKanbanBoard with toasts and rollback
        console.error('Drag operation failed:', error);
      }
    },
    [kanbanData, handleOptimisticDragEnd]
  );

  // Handle data change from drag operations (visual updates only)
  const handleDataChange = useCallback(
    (_newData: KanbanItem[]) => {
      // The kibo-ui component handles the visual update
      // Actual state sync happens through handleDragEnd
    },
    []
  );

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>
          Failed to load board data: {error.message}. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="h-full p-4 bg-background">
      <KanbanProvider
        columns={kanbanData.columns}
        data={kanbanData.items}
        onDataChange={handleDataChange}
        onDragEnd={handleDragEnd}
        className="h-full"
      >
        {(column) => (
          <KanbanBoard id={column.id} key={column.id} className="bg-muted/30 dark:bg-muted/10">
            <KanbanHeader className="flex items-center justify-between bg-muted/50 border-b">
              <span className="font-medium text-foreground">{column.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">
                  {kanbanData.items.filter(item => item.column === column.id).length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onCreateCard?.(column.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditColumn?.(column.originalColumn)}>
                      Rename Column
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteColumn?.(column.id)}
                      className="text-destructive"
                    >
                      Delete Column
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </KanbanHeader>
            
            <KanbanCards id={column.id}>
              {(item: KanbanItem) => (
                <KanbanCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  column={item.column}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  <div 
                    className="space-y-2"
                    onClick={() => onEditCard?.(item.originalCard)}
                  >
                    <p className="font-medium text-sm">{item.originalCard.title}</p>
                    
                    {item.originalCard.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.originalCard.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={getPriorityColor(item.originalCard.priority)} className="text-xs">
                        {item.originalCard.priority}
                      </Badge>
                      
                      {item.originalCard.labels.map(label => (
                        <Badge key={label} variant="outline" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                    
                    {item.originalCard.assignee && (
                      <p className="text-xs text-muted-foreground">
                        Assigned to: {item.originalCard.assignee}
                      </p>
                    )}
                    
                    {item.originalCard.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(item.originalCard.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </KanbanCard>
              )}
            </KanbanCards>
          </KanbanBoard>
        )}
      </KanbanProvider>
    </div>
  );
}