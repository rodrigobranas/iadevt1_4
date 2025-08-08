import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Board } from './components/Board';
import { AddCardForm } from './components/AddCardForm';
import { kanbanApi } from './api/client';
import type { Card, Column } from './api/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateColumn, useRenameColumn, useDeleteColumn } from './hooks/useKanban';

export function KanbanPage() {
  const queryClient = useQueryClient();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [addCardDialog, setAddCardDialog] = useState<{ isOpen: boolean; columnId: string | null }>({
    isOpen: false,
    columnId: null,
  });
  const [addColumnDialog, setAddColumnDialog] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editColumnDialog, setEditColumnDialog] = useState<{ isOpen: boolean; column: Column | null }>({
    isOpen: false,
    column: null,
  });
  const [editColumnName, setEditColumnName] = useState('');

  // Fetch all boards
  const { data: boards, isLoading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: () => kanbanApi.boards.list(),
  });

  // Create board mutation
  const createBoard = useMutation({
    mutationFn: async (name: string) => kanbanApi.boards.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  // Column mutations
  const createColumn = useCreateColumn(selectedBoardId || '');
  const renameColumn = useRenameColumn(selectedBoardId || '');
  const deleteColumn = useDeleteColumn(selectedBoardId || '');

  // Auto-select first board or create one if none exist
  useEffect(() => {
    if (boards && boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId]);

  // Create a default board if none exist
  useEffect(() => {
    if (boards && boards.length === 0) {
      createBoard.mutateAsync('My Kanban Board').then(async (board) => {
        // Create default columns
        await kanbanApi.columns.create(board.id, 'To Do');
        await kanbanApi.columns.create(board.id, 'In Progress');
        await kanbanApi.columns.create(board.id, 'Done');
        
        setSelectedBoardId(board.id);
        queryClient.invalidateQueries({ queryKey: ['boards'] });
      });
    }
  }, [boards]);

  const handleCreateCard = (columnId: string) => {
    setAddCardDialog({ isOpen: true, columnId });
  };

  const handleEditCard = (card: Card) => {
    // TODO: Implement edit card dialog
    console.log('Edit card:', card);
  };

  const handleEditColumn = (column: Column) => {
    setEditColumnName(column.name);
    setEditColumnDialog({ isOpen: true, column });
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (confirm('Are you sure you want to delete this column? All cards will be deleted.')) {
      await deleteColumn.mutateAsync({ columnId, force: true });
    }
  };

  const handleCreateColumn = async () => {
    if (newColumnName.trim() && selectedBoardId) {
      await createColumn.mutateAsync(newColumnName.trim());
      setNewColumnName('');
      setAddColumnDialog(false);
    }
  };

  const handleRenameColumn = async () => {
    if (editColumnName.trim() && editColumnDialog.column) {
      await renameColumn.mutateAsync({
        columnId: editColumnDialog.column.id,
        name: editColumnName.trim(),
      });
      setEditColumnDialog({ isOpen: false, column: null });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-12 w-48 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
        <AlertDescription>Failed to load boards. Please refresh the page.</AlertDescription>
      </Alert>
    );
  }

  if (!boards || boards.length === 0) {
    return (
      <div className="p-4">
        <p>Creating your first board...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Boards</h2>
          <select
            className="border rounded px-3 py-1"
            value={selectedBoardId || ''}
            onChange={(e) => setSelectedBoardId(e.target.value)}
          >
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={() => setAddColumnDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Column
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {selectedBoardId && (
          <Board
            boardId={selectedBoardId}
            onCreateCard={handleCreateCard}
            onEditCard={handleEditCard}
            onEditColumn={handleEditColumn}
            onDeleteColumn={handleDeleteColumn}
          />
        )}
      </div>

      {/* Add Card Dialog */}
      {addCardDialog.columnId && selectedBoardId && (
        <AddCardForm
          boardId={selectedBoardId}
          columnId={addCardDialog.columnId}
          isOpen={addCardDialog.isOpen}
          onClose={() => setAddCardDialog({ isOpen: false, columnId: null })}
        />
      )}

      {/* Add Column Dialog */}
      <Dialog open={addColumnDialog} onOpenChange={setAddColumnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="column-name">Column Name</Label>
              <Input
                id="column-name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Enter column name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateColumn();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColumnDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateColumn}>Create Column</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog 
        open={editColumnDialog.isOpen} 
        onOpenChange={(open) => !open && setEditColumnDialog({ isOpen: false, column: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-column-name">Column Name</Label>
              <Input
                id="edit-column-name"
                value={editColumnName}
                onChange={(e) => setEditColumnName(e.target.value)}
                placeholder="Enter column name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameColumn();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditColumnDialog({ isOpen: false, column: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameColumn}>Rename Column</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}