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
import { useBoard, useMoveCard, useReorderCard } from '../hooks/useKanban';
import type { Card, Column } from '../api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface KanbanBoardProps {
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
  [key: string]: unknown; // Allow additional properties for kibo-ui compatibility
}

export function KanbanBoardComponent({
  boardId,
  onCreateCard,
  onEditCard,
  onEditColumn,
  onDeleteColumn,
}: KanbanBoardProps) {
  const { data, isLoading, error } = useBoard(boardId);
  const moveCard = useMoveCard(boardId);
  const reorderCard = useReorderCard(boardId);

  // Transform data to match kibo-ui format
  const kanbanData = useMemo(() => {
    if (!data) return { columns: [], items: [] };

    const columns = data.columns
      .sort((a, b) => a.position - b.position)
      .map(col => ({
        id: col.id,
        name: col.name,
        originalColumn: col,
      }));

    const items: KanbanItem[] = data.cards.map(card => ({
      id: card.id,
      name: card.title,
      column: card.columnId,
      originalCard: card,
    }));

    return { columns, items };
  }, [data]);

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

      // Determine target column and position
      let targetColumnId: string;
      let targetPosition: number;

      if (overCard) {
        // Dropped on a card
        targetColumnId = overCard.column;
        
        // Get all cards in target column sorted by position
        const columnCards = data?.cards
          .filter(c => c.columnId === targetColumnId)
          .sort((a, b) => a.position - b.position) || [];
        
        // Find the position of the over card
        const overIndex = columnCards.findIndex(c => c.id === overCard.id);
        targetPosition = overIndex >= 0 ? overIndex : 0;
        
        // If moving within same column and moving down, adjust position
        if (activeCard.column === targetColumnId) {
          const activeIndex = columnCards.findIndex(c => c.id === activeCard.id);
          if (activeIndex < overIndex) {
            targetPosition = Math.max(0, targetPosition - 1);
          }
        }
      } else if (overColumn) {
        // Dropped on a column (empty area)
        targetColumnId = overColumn.id;
        // Add to end of column
        const columnCards = data?.cards.filter(c => c.columnId === targetColumnId) || [];
        targetPosition = columnCards.length;
      } else {
        return;
      }

      // Check if it's a move or reorder
      if (activeCard.column === targetColumnId) {
        // Reorder within same column
        await reorderCard.mutateAsync({
          cardId: activeCard.id,
          toPosition: targetPosition,
        });
      } else {
        // Move to different column
        await moveCard.mutateAsync({
          cardId: activeCard.id,
          toColumnId: targetColumnId,
          toPosition: targetPosition,
        });
      }
    },
    [kanbanData, data, moveCard, reorderCard]
  );

  // Handle data change from drag operations
  const handleDataChange = useCallback(
    (newData: KanbanItem[]) => {
      // The kibo-ui component handles the visual update
      // We'll sync with backend in handleDragEnd
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
        <AlertDescription>Failed to load board data. Please refresh the page.</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
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
      <h1 className="text-2xl font-bold mb-4 text-foreground">{data.board.name}</h1>
      
      <KanbanProvider
        columns={kanbanData.columns}
        data={kanbanData.items}
        onDataChange={handleDataChange}
        onDragEnd={handleDragEnd}
        className="h-[calc(100%-3rem)]"
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
                  className="cursor-pointer"
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