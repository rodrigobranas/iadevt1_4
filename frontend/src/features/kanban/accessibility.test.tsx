import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanBoardAccessible } from './components/KanbanBoardAccessible';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Mock the API hooks
vi.mock('./hooks/useKanban', () => ({
  useBoard: vi.fn(() => ({
    data: mockBoardData,
    isLoading: false,
    error: null,
  })),
  useMoveCard: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  useReorderCard: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
}));

const mockBoardData = {
  board: {
    id: 'board-1',
    name: 'Test Board',
  },
  columns: [
    { id: 'col-1', name: 'To Do', position: 0 },
    { id: 'col-2', name: 'In Progress', position: 1 },
    { id: 'col-3', name: 'Done', position: 2 },
  ],
  cards: [
    {
      id: 'card-1',
      title: 'Task 1',
      description: 'Description 1',
      columnId: 'col-1',
      position: 0,
      priority: 'high',
      labels: ['bug'],
      assignee: 'John Doe',
      dueDate: '2024-12-31',
    },
    {
      id: 'card-2',
      title: 'Task 2',
      description: 'Description 2',
      columnId: 'col-1',
      position: 1,
      priority: 'medium',
      labels: ['feature'],
      assignee: 'Jane Smith',
      dueDate: null,
    },
    {
      id: 'card-3',
      title: 'Task 3',
      description: null,
      columnId: 'col-2',
      position: 0,
      priority: 'low',
      labels: [],
      assignee: null,
      dueDate: null,
    },
  ],
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderKanbanBoard = (props = {}) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <KanbanBoardAccessible boardId="board-1" {...props} />
    </QueryClientProvider>
  );
};

describe('Kanban Board Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Keyboard Navigation', () => {
    it('should allow Tab navigation through all interactive elements', async () => {
      renderKanbanBoard();
      const user = userEvent.setup();
      
      // Start with skip link
      await user.tab();
      expect(screen.getByText('Skip to Kanban board')).toHaveFocus();
      
      // Tab through column headers and buttons
      await user.tab();
      const firstColumnHeader = screen.getByRole('heading', { name: /To Do/i });
      expect(firstColumnHeader).toHaveFocus();
    });
    
    it('should handle arrow key navigation between cards', async () => {
      renderKanbanBoard();
      
      // Focus on first card
      const firstCard = screen.getByRole('article', { name: /Task 1/i });
      firstCard.focus();
      
      // Press down arrow
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
      
      // Should move to next card
      await waitFor(() => {
        const secondCard = screen.getByRole('article', { name: /Task 2/i });
        expect(secondCard).toHaveFocus();
      });
    });
    
    it('should handle arrow key navigation between columns', async () => {
      renderKanbanBoard();
      
      // Focus on a card in first column
      const firstCard = screen.getByRole('article', { name: /Task 1/i });
      firstCard.focus();
      
      // Press right arrow
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
      
      // Should move to first card in next column
      await waitFor(() => {
        const cardInNextColumn = screen.getByRole('article', { name: /Task 3/i });
        expect(cardInNextColumn).toHaveFocus();
      });
    });
    
    it('should show keyboard help on Shift+?', async () => {
      renderKanbanBoard();
      
      // Press Shift+?
      fireEvent.keyDown(document, { key: '?', shiftKey: true });
      
      // Should show keyboard shortcuts dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /Keyboard shortcuts/i })).toBeInTheDocument();
      });
    });
  });
  
  describe('ARIA Attributes', () => {
    it('should have proper ARIA labels on board regions', () => {
      renderKanbanBoard();
      
      // Check board region
      const board = screen.getByRole('region', { name: /Test Board Kanban board/i });
      expect(board).toBeInTheDocument();
    });
    
    it('should have proper ARIA labels on columns', () => {
      renderKanbanBoard();
      
      // Check column groups
      const todoColumn = screen.getByRole('group', { name: /To Do column with 2 cards/i });
      expect(todoColumn).toBeInTheDocument();
      
      const inProgressColumn = screen.getByRole('group', { name: /In Progress column with 1 card/i });
      expect(inProgressColumn).toBeInTheDocument();
      
      const doneColumn = screen.getByRole('group', { name: /Done column with 0 cards/i });
      expect(doneColumn).toBeInTheDocument();
    });
    
    it('should have proper ARIA labels on cards', () => {
      renderKanbanBoard();
      
      // Check card articles
      const card1 = screen.getByRole('article', { name: /Card: Task 1/i });
      expect(card1).toBeInTheDocument();
      
      const card2 = screen.getByRole('article', { name: /Card: Task 2/i });
      expect(card2).toBeInTheDocument();
    });
    
    it('should have proper ARIA labels on buttons', () => {
      renderKanbanBoard();
      
      // Check add card buttons
      const addCardButton = screen.getByRole('button', { name: /Add card to To Do column/i });
      expect(addCardButton).toBeInTheDocument();
      
      // Check more options buttons
      const moreOptionsButton = screen.getByRole('button', { name: /More options for To Do column/i });
      expect(moreOptionsButton).toBeInTheDocument();
    });
    
    it('should have proper ARIA labels on priority badges', () => {
      renderKanbanBoard();
      
      // Check priority labels
      expect(screen.getByLabelText(/High priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Medium priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Low priority/i)).toBeInTheDocument();
    });
    
    it('should have proper ARIA labels on labels', () => {
      renderKanbanBoard();
      
      // Check label badges
      expect(screen.getByLabelText(/Label: bug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Label: feature/i)).toBeInTheDocument();
    });
  });
  
  describe('Screen Reader Announcements', () => {
    it('should announce loading state', () => {
      vi.mocked(useBoard).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });
      
      renderKanbanBoard();
      
      // Check for loading announcement
      const loadingRegion = screen.getByRole('status', { name: /Loading board/i });
      expect(loadingRegion).toBeInTheDocument();
      expect(screen.getByText(/Loading Kanban board/i)).toBeInTheDocument();
    });
    
    it('should announce error state', () => {
      vi.mocked(useBoard).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load'),
      });
      
      renderKanbanBoard();
      
      // Check for error announcement
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(screen.getByText(/Failed to load board data/i)).toBeInTheDocument();
    });
    
    it('should have keyboard instructions for screen readers', () => {
      renderKanbanBoard();
      
      // Check for keyboard navigation instructions (they are sr-only)
      const instructions = document.querySelector('[aria-label="Keyboard navigation instructions"]');
      expect(instructions).toBeInTheDocument();
      expect(instructions).toHaveClass('sr-only');
    });
  });
  
  describe('Focus Management', () => {
    it('should maintain focus after card interaction', async () => {
      const onEditCard = vi.fn();
      renderKanbanBoard({ onEditCard });
      
      // Focus on a card
      const card = screen.getByRole('article', { name: /Task 1/i });
      card.focus();
      expect(card).toHaveFocus();
      
      // Trigger edit with Enter key
      fireEvent.keyDown(card, { key: 'Enter' });
      
      // Card should still have focus
      expect(card).toHaveFocus();
      expect(onEditCard).toHaveBeenCalledWith(mockBoardData.cards[0]);
    });
    
    it('should support skip to content link', async () => {
      renderKanbanBoard();
      const user = userEvent.setup();
      
      // Tab to skip link
      await user.tab();
      const skipLink = screen.getByText('Skip to Kanban board');
      expect(skipLink).toHaveFocus();
      
      // Activate skip link
      await user.keyboard('{Enter}');
      
      // Focus should move to main board content
      const board = document.getElementById('kanban-board');
      expect(board).toBeInTheDocument();
    });
  });
  
  describe('Visual Indicators', () => {
    it('should have visible focus indicators', () => {
      renderKanbanBoard();
      
      // Check that cards have focus styles
      const card = screen.getByRole('article', { name: /Task 1/i });
      expect(card).toHaveClass('focus:ring-2', 'focus:ring-primary');
    });
    
    it('should display card counts in column headers', () => {
      renderKanbanBoard();
      
      // Check card counts
      expect(screen.getByLabelText(/2 cards in To Do/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/1 card in In Progress/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/0 cards in Done/i)).toBeInTheDocument();
    });
  });
  
  describe('Alternative Interactions', () => {
    it('should allow card editing via keyboard', async () => {
      const onEditCard = vi.fn();
      renderKanbanBoard({ onEditCard });
      
      // Focus on a card
      const card = screen.getByRole('article', { name: /Task 1/i });
      card.focus();
      
      // Press Enter to edit
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(onEditCard).toHaveBeenCalledWith(mockBoardData.cards[0]);
      
      // Press Space to edit
      onEditCard.mockClear();
      fireEvent.keyDown(card, { key: ' ' });
      expect(onEditCard).toHaveBeenCalledWith(mockBoardData.cards[0]);
    });
    
    it('should provide dropdown menu for column actions', async () => {
      const onEditColumn = vi.fn();
      const onDeleteColumn = vi.fn();
      renderKanbanBoard({ onEditColumn, onDeleteColumn });
      const user = userEvent.setup();
      
      // Click more options button
      const moreButton = screen.getByRole('button', { name: /More options for To Do column/i });
      await user.click(moreButton);
      
      // Check menu items are available
      expect(screen.getByText('Rename Column')).toBeInTheDocument();
      expect(screen.getByText('Delete Column')).toBeInTheDocument();
    });
  });
});

describe('Color Contrast Compliance', () => {
  it('should use semantic variants for priority badges', () => {
    renderKanbanBoard();
    
    // High priority should use destructive variant
    const highPriority = screen.getByText('high');
    expect(highPriority.closest('.badge')).toHaveClass('destructive');
    
    // Medium priority should use default variant  
    const mediumPriority = screen.getByText('medium');
    expect(mediumPriority.closest('.badge')).toHaveClass('default');
    
    // Low priority should use secondary variant
    const lowPriority = screen.getByText('low');
    expect(lowPriority.closest('.badge')).toHaveClass('secondary');
  });
  
  it('should include text labels alongside color indicators', () => {
    renderKanbanBoard();
    
    // Priority is shown as text, not just color
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
    
    // Labels are shown as text
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('feature')).toBeInTheDocument();
  });
});