import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kanbanApi } from '../api/client';
import type { Card, CreateCardInput, UpdateCardInput } from '../api/client';

// Hook to fetch board with columns and cards
export function useBoard(boardId: string) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const [board, columns, cards] = await Promise.all([
        kanbanApi.boards.getById(boardId),
        kanbanApi.columns.list(boardId),
        kanbanApi.cards.list(boardId),
      ]);
      return { board, columns, cards };
    },
    enabled: !!boardId,
  });
}

// Hook to move a card to a different column
export function useMoveCard(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      cardId, 
      toColumnId, 
      toPosition 
    }: { 
      cardId: string; 
      toColumnId: string; 
      toPosition: number;
    }) => {
      return kanbanApi.cards.move(cardId, toColumnId, toPosition);
    },
    onMutate: async ({ cardId, toColumnId, toPosition }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['board', boardId]);

      // Optimistically update
      queryClient.setQueryData(['board', boardId], (old: any) => {
        if (!old) return old;
        
        const updatedCards = [...old.cards];
        const cardIndex = updatedCards.findIndex((c: Card) => c.id === cardId);
        
        if (cardIndex !== -1) {
          const card = updatedCards[cardIndex];
          
          // Update card's column and position
          updatedCards[cardIndex] = {
            ...card,
            columnId: toColumnId,
            position: toPosition,
          };
          
          // Reorder cards in the target column
          const targetColumnCards = updatedCards
            .filter((c: Card) => c.columnId === toColumnId && c.id !== cardId)
            .sort((a: Card, b: Card) => a.position - b.position);
          
          // Insert card at new position
          targetColumnCards.splice(toPosition, 0, updatedCards[cardIndex]);
          
          // Update positions
          targetColumnCards.forEach((card: Card, index: number) => {
            const idx = updatedCards.findIndex((c: Card) => c.id === card.id);
            if (idx !== -1) {
              updatedCards[idx] = { ...card, position: index };
            }
          });
        }
        
        return { ...old, cards: updatedCards };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(['board', boardId], context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

// Hook to reorder a card within the same column
export function useReorderCard(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      cardId, 
      toPosition 
    }: { 
      cardId: string; 
      toPosition: number;
    }) => {
      return kanbanApi.cards.reorder(cardId, toPosition);
    },
    onMutate: async ({ cardId, toPosition }) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });
      const previousData = queryClient.getQueryData(['board', boardId]);

      queryClient.setQueryData(['board', boardId], (old: any) => {
        if (!old) return old;
        
        const updatedCards = [...old.cards];
        const cardIndex = updatedCards.findIndex((c: Card) => c.id === cardId);
        
        if (cardIndex !== -1) {
          const card = updatedCards[cardIndex];
          const columnId = card.columnId;
          
          // Get cards in the same column
          const columnCards = updatedCards
            .filter((c: Card) => c.columnId === columnId)
            .sort((a: Card, b: Card) => a.position - b.position);
          
          // Remove card from current position
          const oldPosition = columnCards.findIndex((c: Card) => c.id === cardId);
          if (oldPosition !== -1) {
            columnCards.splice(oldPosition, 1);
          }
          
          // Insert at new position
          columnCards.splice(toPosition, 0, card);
          
          // Update positions
          columnCards.forEach((card: Card, index: number) => {
            const idx = updatedCards.findIndex((c: Card) => c.id === card.id);
            if (idx !== -1) {
              updatedCards[idx] = { ...card, position: index };
            }
          });
        }
        
        return { ...old, cards: updatedCards };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['board', boardId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

// Hook to create a new card
export function useCreateCard(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCardInput) => {
      return kanbanApi.cards.create(boardId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

// Hook to update a card
export function useUpdateCard(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      cardId, 
      input 
    }: { 
      cardId: string; 
      input: UpdateCardInput;
    }) => {
      return kanbanApi.cards.update(cardId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

// Hook to delete a card
export function useDeleteCard(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      return kanbanApi.cards.delete(cardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

// Hook to create a column
export function useCreateColumn(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      return kanbanApi.columns.create(boardId, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

// Hook to rename a column
export function useRenameColumn(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      columnId, 
      name 
    }: { 
      columnId: string; 
      name: string;
    }) => {
      return kanbanApi.columns.rename(columnId, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

// Hook to delete a column
export function useDeleteColumn(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      columnId, 
      force = false 
    }: { 
      columnId: string; 
      force?: boolean;
    }) => {
      return kanbanApi.columns.delete(columnId, force);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}