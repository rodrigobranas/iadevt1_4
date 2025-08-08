import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { kanbanApi, type Card, type Column, type ApiError } from '../api/client';

interface BoardState {
  boardId: string;
  columns: Column[];
  cards: Card[];
  isLoading: boolean;
  error: Error | null;
}

interface MoveCardPayload {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  toPosition: number;
}

interface ReorderCardPayload {
  cardId: string;
  columnId: string;
  toPosition: number;
}

interface UseKanbanBoardOptions {
  boardId: string;
  onError?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
}

export function useKanbanBoard({
  boardId,
  onError,
  maxRetries = 3,
  retryDelay = 1000,
}: UseKanbanBoardOptions) {
  const [state, setState] = useState<BoardState>({
    boardId,
    columns: [],
    cards: [],
    isLoading: true,
    error: null,
  });

  // Store previous state for rollback
  const previousStateRef = useRef<Pick<BoardState, 'cards' | 'columns'> | undefined>(undefined);
  const retryCountRef = useRef<Map<string, number>>(new Map());

  // Load initial data
  const loadBoard = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const boardData = await kanbanApi.getFullBoard(boardId);
      setState({
        boardId,
        columns: boardData.columns,
        cards: boardData.cards,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, isLoading: false, error: err }));
      onError?.(err);
      toast.error('Failed to load board', {
        description: err.message,
      });
    }
  }, [boardId, onError]);

  // Load board on mount and when boardId changes
  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Helper to normalize card positions after server update
  const normalizePositions = useCallback((cards: Card[], columnId: string): Card[] => {
    const columnCards = cards
      .filter(c => c.columnId === columnId)
      .sort((a, b) => a.position - b.position);
    
    // Reassign positions sequentially
    columnCards.forEach((card, index) => {
      card.position = index;
    });
    
    return cards;
  }, []);

  // Optimistic move card to different column
  const moveCard = useCallback(async ({
    cardId,
    fromColumnId,
    toColumnId,
    toPosition,
  }: MoveCardPayload) => {
    // Store current state for potential rollback
    previousStateRef.current = {
      cards: [...state.cards],
      columns: [...state.columns],
    };

    // Optimistically update local state
    setState(prev => {
      const newCards = [...prev.cards];
      const cardIndex = newCards.findIndex(c => c.id === cardId);
      
      if (cardIndex === -1) return prev;
      
      const card = { ...newCards[cardIndex] };
      
      // Update card's column and position
      card.columnId = toColumnId;
      card.position = toPosition;
      newCards[cardIndex] = card;
      
      // Adjust positions in source column
      const sourceCards = newCards
        .filter(c => c.columnId === fromColumnId && c.id !== cardId)
        .sort((a, b) => a.position - b.position);
      
      sourceCards.forEach((c, idx) => {
        const index = newCards.findIndex(card => card.id === c.id);
        if (index !== -1) {
          newCards[index] = { ...c, position: idx };
        }
      });
      
      // Adjust positions in target column
      const targetCards = newCards
        .filter(c => c.columnId === toColumnId && c.id !== cardId)
        .sort((a, b) => a.position - b.position);
      
      // Insert card at new position
      targetCards.splice(toPosition, 0, card);
      
      // Update all positions in target column
      targetCards.forEach((c, idx) => {
        const index = newCards.findIndex(card => card.id === c.id);
        if (index !== -1) {
          newCards[index] = { ...newCards[index], position: idx };
        }
      });
      
      return { ...prev, cards: newCards };
    });

    // Call API with retry logic
    const operationId = `move-${cardId}-${Date.now()}`;
    let retries = 0;
    
    const attemptMove = async (): Promise<void> => {
      try {
        await kanbanApi.cards.move(cardId, toColumnId, toPosition);
        
        // Clear retry count on success
        retryCountRef.current.delete(operationId);
        
        // Server might have normalized positions, so fetch latest state
        const updatedCards = await kanbanApi.cards.list(boardId);
        setState(prev => ({ ...prev, cards: updatedCards }));
        
      } catch (error) {
        const apiError = error as ApiError;
        
        if (retries < maxRetries) {
          retries++;
          toast.error(`Move failed, retrying... (${retries}/${maxRetries})`, {
            description: apiError.message,
          });
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retries - 1)));
          return attemptMove();
        }
        
        // Max retries reached, rollback
        toast.error('Failed to move card', {
          description: `${apiError.message}. Changes have been reverted.`,
          duration: 5000,
        });
        
        if (previousStateRef.current) {
          setState(prev => ({
            ...prev,
            cards: previousStateRef.current!.cards,
            columns: previousStateRef.current!.columns,
          }));
        }
        
        onError?.(apiError);
        throw error;
      }
    };
    
    return attemptMove();
  }, [state.cards, boardId, maxRetries, retryDelay, onError]);

  // Optimistic reorder card within same column
  const reorderCard = useCallback(async ({
    cardId,
    columnId,
    toPosition,
  }: ReorderCardPayload) => {
    // Store current state for potential rollback
    previousStateRef.current = {
      cards: [...state.cards],
      columns: [...state.columns],
    };

    // Optimistically update local state
    setState(prev => {
      const newCards = [...prev.cards];
      
      // Get cards in the column
      const columnCards = newCards
        .filter(c => c.columnId === columnId)
        .sort((a, b) => a.position - b.position);
      
      // Find the card being moved
      const cardIndex = columnCards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return prev;
      
      // Remove card from current position
      const [movedCard] = columnCards.splice(cardIndex, 1);
      
      // Insert at new position
      columnCards.splice(toPosition, 0, movedCard);
      
      // Update positions for all cards in column
      columnCards.forEach((card, idx) => {
        const index = newCards.findIndex(c => c.id === card.id);
        if (index !== -1) {
          newCards[index] = { ...newCards[index], position: idx };
        }
      });
      
      return { ...prev, cards: newCards };
    });

    // Call API with retry logic
    const operationId = `reorder-${cardId}-${Date.now()}`;
    let retries = 0;
    
    const attemptReorder = async (): Promise<void> => {
      try {
        await kanbanApi.cards.reorder(cardId, toPosition);
        
        // Clear retry count on success
        retryCountRef.current.delete(operationId);
        
        // Server might have normalized positions, so fetch latest state
        const updatedCards = await kanbanApi.cards.list(boardId);
        setState(prev => ({ ...prev, cards: updatedCards }));
        
      } catch (error) {
        const apiError = error as ApiError;
        
        if (retries < maxRetries) {
          retries++;
          toast.warning(`Reorder failed, retrying... (${retries}/${maxRetries})`, {
            description: apiError.message,
          });
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retries - 1)));
          return attemptReorder();
        }
        
        // Max retries reached, rollback
        toast.error('Failed to reorder card', {
          description: `${apiError.message}. Changes have been reverted.`,
          duration: 5000,
        });
        
        if (previousStateRef.current) {
          setState(prev => ({
            ...prev,
            cards: previousStateRef.current!.cards,
            columns: previousStateRef.current!.columns,
          }));
        }
        
        onError?.(apiError);
        throw error;
      }
    };
    
    return attemptReorder();
  }, [state.cards, boardId, maxRetries, retryDelay, onError]);

  // Handle drag end event from Kanban component
  const handleDragEnd = useCallback(async (
    activeId: string,
    overId: string | null,
    _activeColumnId: string,
    overColumnId: string | null
  ) => {
    if (!overId || activeId === overId) {
      return;
    }

    const activeCard = state.cards.find(c => c.id === activeId);
    if (!activeCard) return;

    const overCard = state.cards.find(c => c.id === overId);
    const targetColumnId = overColumnId || overCard?.columnId;
    
    if (!targetColumnId) return;

    // Calculate target position
    let targetPosition: number;
    
    if (overCard) {
      // Dropped on a card
      const columnCards = state.cards
        .filter(c => c.columnId === targetColumnId)
        .sort((a, b) => a.position - b.position);
      
      const overIndex = columnCards.findIndex(c => c.id === overCard.id);
      targetPosition = overIndex >= 0 ? overIndex : 0;
      
      // Adjust if moving within same column and moving down
      if (activeCard.columnId === targetColumnId) {
        const activeIndex = columnCards.findIndex(c => c.id === activeCard.id);
        if (activeIndex < overIndex) {
          targetPosition = Math.max(0, targetPosition - 1);
        }
      }
    } else {
      // Dropped on empty column
      const columnCards = state.cards.filter(c => c.columnId === targetColumnId);
      targetPosition = columnCards.length;
    }

    // Perform move or reorder
    if (activeCard.columnId === targetColumnId) {
      await reorderCard({
        cardId: activeId,
        columnId: targetColumnId,
        toPosition: targetPosition,
      });
    } else {
      await moveCard({
        cardId: activeId,
        fromColumnId: activeCard.columnId,
        toColumnId: targetColumnId,
        toPosition: targetPosition,
      });
    }
  }, [state.cards, moveCard, reorderCard]);

  // Refresh board data from server
  const refresh = useCallback(async () => {
    try {
      const boardData = await kanbanApi.getFullBoard(boardId);
      setState(prev => ({
        ...prev,
        columns: boardData.columns,
        cards: boardData.cards,
        error: null,
      }));
    } catch (error) {
      const err = error as Error;
      toast.error('Failed to refresh board', {
        description: err.message,
      });
      onError?.(err);
    }
  }, [boardId, onError]);

  return {
    // State
    boardId: state.boardId,
    columns: state.columns,
    cards: state.cards,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    moveCard,
    reorderCard,
    handleDragEnd,
    refresh,
    
    // Helpers
    normalizePositions,
  };
}