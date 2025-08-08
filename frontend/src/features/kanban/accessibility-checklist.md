# Kanban Board Accessibility Checklist

## Keyboard Navigation ⌨️

### Essential Controls
- [ ] **Tab Navigation**: Can tab through all interactive elements (cards, buttons, dropdowns)
- [ ] **Arrow Keys**: Can navigate between cards within a column (up/down)
- [ ] **Arrow Keys**: Can navigate between columns (left/right)
- [ ] **Space/Enter**: Can pick up a card for moving
- [ ] **Arrow Keys While Dragging**: Can move card to different positions/columns
- [ ] **Space/Enter**: Can drop card at current position
- [ ] **Escape**: Can cancel drag operation

### Focus Management
- [ ] **Visible Focus Indicators**: Focus ring clearly visible on all interactive elements
- [ ] **Focus Trap Prevention**: Focus doesn't get trapped in any area
- [ ] **Focus Return**: After drag operation, focus returns to the moved card
- [ ] **Skip Links**: Option to skip to main board content

## Screen Reader Support 🔊

### ARIA Announcements
- [ ] **Drag Start**: Announces "Picked up card [name] from [column]"
- [ ] **Drag Over**: Announces "Dragging card [name] over [column]"
- [ ] **Drag End**: Announces "Dropped card [name] into [column]"
- [ ] **Drag Cancel**: Announces "Cancelled dragging card [name]"

### ARIA Labels & Roles
- [ ] **Board Container**: Has appropriate role="region" and aria-label
- [ ] **Columns**: Have role="group" and aria-label with column name
- [ ] **Cards**: Have role="article" or appropriate semantic structure
- [ ] **Card Count**: Column headers announce number of cards
- [ ] **Interactive Elements**: All buttons have descriptive aria-labels

### Live Regions
- [ ] **Status Updates**: Card moves announced via aria-live regions
- [ ] **Error Messages**: Failed operations announced to screen readers
- [ ] **Loading States**: Loading status communicated to screen readers

## Visual Design 🎨

### Color & Contrast (WCAG AA)
- [ ] **Text Contrast**: All text meets 4.5:1 contrast ratio (normal text)
- [ ] **Large Text Contrast**: Large text meets 3:1 contrast ratio
- [ ] **Interactive Elements**: Buttons/links meet 3:1 contrast ratio
- [ ] **Focus Indicators**: Focus rings meet 3:1 contrast ratio
- [ ] **Priority Badges**: Colors are not the only indicator (use text/icons too)

### Visual Feedback
- [ ] **Hover States**: Clear hover indicators on interactive elements
- [ ] **Active States**: Visual feedback when dragging/interacting
- [ ] **Loading States**: Skeleton screens or spinners for loading
- [ ] **Error States**: Clear visual indication of errors

## Mobile & Touch Accessibility 📱

- [ ] **Touch Target Size**: Minimum 44x44px for all interactive elements
- [ ] **Touch Gestures**: Drag and drop works with touch
- [ ] **Alternative Actions**: Menu options for move/reorder without drag

## Assistive Technology Testing 🧪

### Screen Readers to Test
- [ ] **NVDA** (Windows): Full functionality with announcements
- [ ] **JAWS** (Windows): Full functionality with announcements
- [ ] **VoiceOver** (macOS): Full functionality with announcements
- [ ] **VoiceOver** (iOS): Touch navigation works correctly

### Keyboard-Only Testing
- [ ] Complete user journey without mouse
- [ ] Create card (if applicable)
- [ ] Move card between columns
- [ ] Reorder cards within column
- [ ] Edit card details
- [ ] Delete card (if applicable)

## Performance & Reliability ⚡

- [ ] **Animation Respect**: Respects prefers-reduced-motion
- [ ] **Responsive Design**: Works across viewport sizes
- [ ] **Error Recovery**: Graceful handling of failed operations
- [ ] **Offline Support**: Clear messaging when offline

## Documentation & Help 📚

- [ ] **Keyboard Shortcuts Guide**: Document available shortcuts
- [ ] **Accessibility Statement**: Clear documentation of a11y features
- [ ] **Help Text**: Contextual help for complex interactions

## Compliance Checklist ✅

### WCAG 2.1 Level AA Requirements
- [ ] **1.3.1 Info and Relationships**: Structure conveyed through presentation
- [ ] **1.4.3 Contrast (Minimum)**: Text contrast ratios met
- [ ] **2.1.1 Keyboard**: All functionality available via keyboard
- [ ] **2.1.2 No Keyboard Trap**: Focus can be moved away
- [ ] **2.4.3 Focus Order**: Logical focus order maintained
- [ ] **2.4.7 Focus Visible**: Focus indicator always visible
- [ ] **3.2.1 On Focus**: No unexpected context changes on focus
- [ ] **4.1.2 Name, Role, Value**: All UI components properly labeled
- [ ] **4.1.3 Status Messages**: Status messages announced to AT

## Testing Tools 🛠️

- [ ] **axe DevTools**: Run automated accessibility scan
- [ ] **WAVE**: Check for accessibility issues
- [ ] **Lighthouse**: Run accessibility audit
- [ ] **Keyboard Navigation Tester**: Manual keyboard testing
- [ ] **Screen Reader Testing**: Manual testing with NVDA/VoiceOver

## Current Status Summary

### ✅ Already Implemented
- Basic ARIA announcements for drag operations
- Keyboard sensor enabled (KeyboardSensor)
- Mouse and touch sensors configured
- Basic focus management with useSortable

### ⚠️ Needs Verification
- Complete keyboard navigation flow
- Screen reader announcement quality
- Color contrast ratios
- Focus indicator visibility

### ❌ Missing/Needs Implementation
- Keyboard shortcuts documentation
- Alternative move methods (non-drag)
- Loading state announcements
- Error state handling