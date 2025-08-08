// Integration test script to verify Kanban functionality
import { kanbanApi } from './api/client';

export async function testKanbanIntegration() {
  console.log('Starting Kanban integration test...');
  
  try {
    // 1. List boards
    console.log('\n1. Listing boards...');
    const boards = await kanbanApi.boards.list();
    console.log(`Found ${boards.length} board(s)`);
    
    let boardId: string;
    
    if (boards.length === 0) {
      // Create a test board
      console.log('\n2. Creating test board...');
      const newBoard = await kanbanApi.boards.create('Integration Test Board');
      boardId = newBoard.id;
      console.log(`Created board: ${newBoard.name} (${newBoard.id})`);
    } else {
      boardId = boards[0].id;
      console.log(`Using existing board: ${boards[0].name} (${boards[0].id})`);
    }
    
    // 3. List columns
    console.log('\n3. Listing columns...');
    let columns = await kanbanApi.columns.list(boardId);
    console.log(`Found ${columns.length} column(s)`);
    
    if (columns.length === 0) {
      // Create test columns
      console.log('\n4. Creating test columns...');
      await kanbanApi.columns.create(boardId, 'To Do');
      await kanbanApi.columns.create(boardId, 'In Progress');
      await kanbanApi.columns.create(boardId, 'Done');
      columns = await kanbanApi.columns.list(boardId);
      console.log(`Created ${columns.length} columns`);
    }
    
    // 5. Create a test card
    console.log('\n5. Creating test card...');
    const todoColumn = columns.find(c => c.name.includes('To Do')) || columns[0];
    const newCard = await kanbanApi.cards.create(boardId, {
      columnId: todoColumn.id,
      title: 'Test Card ' + Date.now(),
      description: 'This is a test card created by integration test',
      priority: 'medium',
      labels: ['test', 'integration'],
    });
    console.log(`Created card: ${newCard.title} (${newCard.id})`);
    
    // 6. List cards
    console.log('\n6. Listing cards...');
    const cards = await kanbanApi.cards.list(boardId);
    console.log(`Found ${cards.length} card(s)`);
    
    // 7. Test move card
    if (columns.length > 1) {
      console.log('\n7. Testing card move...');
      const targetColumn = columns[1];
      await kanbanApi.cards.move(newCard.id, targetColumn.id, 0);
      console.log(`Moved card to ${targetColumn.name}`);
      
      // Verify move
      const updatedCard = await kanbanApi.cards.getById(newCard.id);
      if (updatedCard.columnId === targetColumn.id) {
        console.log('✅ Card move verified successfully');
      } else {
        console.error('❌ Card move failed - card is still in original column');
      }
    }
    
    // 8. Test card update
    console.log('\n8. Testing card update...');
    const updatedCard = await kanbanApi.cards.update(newCard.id, {
      title: 'Updated Test Card',
      priority: 'high',
    });
    console.log(`Updated card: ${updatedCard.title} (priority: ${updatedCard.priority})`);
    
    // 9. Test card deletion
    console.log('\n9. Testing card deletion...');
    await kanbanApi.cards.delete(newCard.id);
    console.log('Card deleted successfully');
    
    console.log('\n✅ Integration test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testKanbanIntegration();
}