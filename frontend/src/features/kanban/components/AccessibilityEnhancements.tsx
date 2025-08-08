import { useEffect } from 'react';

/**
 * Accessibility enhancement component for Kanban board
 * Provides keyboard navigation hints and screen reader improvements
 */
export function AccessibilityEnhancements() {
  useEffect(() => {
    // Add keyboard navigation instructions to the page for screen readers
    const instructions = document.createElement('div');
    instructions.className = 'sr-only';
    instructions.setAttribute('role', 'region');
    instructions.setAttribute('aria-label', 'Keyboard navigation instructions');
    instructions.innerHTML = `
      <h2>Keyboard Navigation Instructions</h2>
      <ul>
        <li>Use Tab to navigate between cards and buttons</li>
        <li>Use Arrow keys to navigate between cards in a column</li>
        <li>Use Left and Right arrows to navigate between columns</li>
        <li>Press Space or Enter to pick up a card</li>
        <li>Use Arrow keys while holding a card to move it</li>
        <li>Press Space or Enter again to drop the card</li>
        <li>Press Escape to cancel the drag operation</li>
      </ul>
    `;
    
    // Insert at the beginning of the body for screen readers
    document.body.insertBefore(instructions, document.body.firstChild);
    
    return () => {
      document.body.removeChild(instructions);
    };
  }, []);
  
  return null;
}

/**
 * Hook to enhance keyboard navigation for the Kanban board
 */
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle navigation keys when not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Check if we're focused on a card or column
      const activeElement = document.activeElement;
      if (!activeElement) return;
      
      const isCard = activeElement.closest('[role="article"]');
      const isColumn = activeElement.closest('[role="group"]');
      
      if (!isCard && !isColumn) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
          // Navigate between cards in the same column
          e.preventDefault();
          navigateCards(e.key === 'ArrowUp' ? 'up' : 'down');
          break;
          
        case 'ArrowLeft':
        case 'ArrowRight':
          // Navigate between columns
          e.preventDefault();
          navigateColumns(e.key === 'ArrowLeft' ? 'left' : 'right');
          break;
          
        case '?':
          // Show keyboard shortcuts help
          if (e.shiftKey) {
            showKeyboardHelp();
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const navigateCards = (direction: 'up' | 'down') => {
    const cards = Array.from(document.querySelectorAll('[role="article"]'));
    const currentIndex = cards.findIndex(card => card.contains(document.activeElement));
    
    if (currentIndex === -1) return;
    
    const nextIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(cards.length - 1, currentIndex + 1);
    
    const nextCard = cards[nextIndex] as HTMLElement;
    nextCard?.focus();
  };
  
  const navigateColumns = (direction: 'left' | 'right') => {
    const columns = Array.from(document.querySelectorAll('[role="group"]'));
    const currentColumn = columns.find(col => col.contains(document.activeElement));
    
    if (!currentColumn) return;
    
    const currentIndex = columns.indexOf(currentColumn);
    const nextIndex = direction === 'left'
      ? Math.max(0, currentIndex - 1)
      : Math.min(columns.length - 1, currentIndex + 1);
    
    const nextColumn = columns[nextIndex];
    const firstCard = nextColumn?.querySelector('[role="article"]') as HTMLElement;
    
    if (firstCard) {
      firstCard.focus();
    } else {
      // Focus on column header if no cards
      const header = nextColumn?.querySelector('[role="heading"]') as HTMLElement;
      header?.focus();
    }
  };
  
  const showKeyboardHelp = () => {
    // Create and show a modal with keyboard shortcuts
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Keyboard shortcuts');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
        <h2 class="text-xl font-bold mb-4">Keyboard Shortcuts</h2>
        <dl class="space-y-2">
          <div class="flex justify-between">
            <dt class="font-medium">Tab</dt>
            <dd>Navigate elements</dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-medium">↑/↓</dt>
            <dd>Navigate cards</dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-medium">←/→</dt>
            <dd>Navigate columns</dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-medium">Space/Enter</dt>
            <dd>Pick up/drop card</dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-medium">Escape</dt>
            <dd>Cancel drag</dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-medium">?</dt>
            <dd>Show this help</dd>
          </div>
        </dl>
        <button 
          class="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onclick="this.closest('[role=dialog]').remove()"
        >
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on close button
    const closeButton = modal.querySelector('button') as HTMLElement;
    closeButton?.focus();
    
    // Remove on Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  };
}

/**
 * Component to provide skip navigation link
 */
export function SkipToContent() {
  return (
    <a
      href="#kanban-board"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded focus:z-50"
    >
      Skip to Kanban board
    </a>
  );
}

/**
 * Hook to announce status messages to screen readers
 */
export function useStatusAnnouncer() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create or get the live region
    let liveRegion = document.getElementById('status-announcer');
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'status-announcer';
      liveRegion.className = 'sr-only';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(liveRegion);
    }
    
    // Update the announcement
    liveRegion.textContent = message;
    
    // Clear after a delay to allow for new announcements
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  };
  
  return { announce };
}