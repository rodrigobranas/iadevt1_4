// Test script to populate board with sample data
import { kanbanApi } from './api/client';

export async function createTestData() {
  try {
    // Get or create a board
    const boards = await kanbanApi.boards.list();
    let boardId: string;
    
    if (boards.length === 0) {
      const newBoard = await kanbanApi.boards.create('Project Management');
      boardId = newBoard.id;
      
      // Create columns
      await kanbanApi.columns.create(boardId, 'To Do');
      await kanbanApi.columns.create(boardId, 'In Progress');
      await kanbanApi.columns.create(boardId, 'Review');
      await kanbanApi.columns.create(boardId, 'Done');
    } else {
      boardId = boards[0].id;
    }
    
    // Get columns
    const columns = await kanbanApi.columns.list(boardId);
    if (columns.length === 0) {
      console.error('No columns found');
      return;
    }
    
    // Check if cards already exist
    const existingCards = await kanbanApi.cards.list(boardId);
    if (existingCards.length > 0) {
      console.log('Cards already exist');
      return;
    }
    
    const todoColumn = columns.find(c => c.name.includes('To Do')) || columns[0];
    const inProgressColumn = columns.find(c => c.name.includes('Progress')) || columns[1];
    const reviewColumn = columns.find(c => c.name.includes('Review')) || columns[2];
    const doneColumn = columns.find(c => c.name.includes('Done')) || columns[columns.length - 1];
    
    // Create sample cards
    const cards = [
      {
        columnId: todoColumn.id,
        title: 'Setup project repository',
        description: 'Initialize Git repository and setup branch protection rules',
        priority: 'high' as const,
        labels: ['setup', 'devops'],
        assignee: 'alice@example.com',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        columnId: todoColumn.id,
        title: 'Design database schema',
        description: 'Create ERD and define table structures for the application',
        priority: 'high' as const,
        labels: ['database', 'design'],
        assignee: 'bob@example.com',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        columnId: inProgressColumn.id,
        title: 'Implement authentication',
        description: 'Add JWT-based authentication with refresh tokens',
        priority: 'high' as const,
        labels: ['backend', 'security'],
        assignee: 'charlie@example.com',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        columnId: inProgressColumn.id,
        title: 'Create API documentation',
        description: 'Document all REST endpoints using OpenAPI specification',
        priority: 'medium' as const,
        labels: ['documentation', 'api'],
        assignee: 'diana@example.com',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        columnId: reviewColumn.id,
        title: 'User profile component',
        description: 'Build React component for user profile display and editing',
        priority: 'medium' as const,
        labels: ['frontend', 'ui'],
        assignee: 'eve@example.com',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        columnId: doneColumn.id,
        title: 'Setup CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment',
        priority: 'high' as const,
        labels: ['devops', 'automation'],
        assignee: 'frank@example.com',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        columnId: doneColumn.id,
        title: 'Configure ESLint and Prettier',
        description: 'Setup code quality tools with team-agreed rules',
        priority: 'low' as const,
        labels: ['tooling', 'quality'],
        assignee: 'grace@example.com',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        columnId: todoColumn.id,
        title: 'Write unit tests',
        description: 'Achieve 80% code coverage for critical business logic',
        priority: 'medium' as const,
        labels: ['testing', 'quality'],
        assignee: 'henry@example.com',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    
    // Create all cards
    for (const cardData of cards) {
      await kanbanApi.cards.create(boardId, cardData);
    }
    
    console.log('Test data created successfully!');
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}