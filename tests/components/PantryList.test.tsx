import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PantryList } from '../../app/components/pantry/PantryList';

// Mock the Icons component since it might use external dependencies
jest.mock('@/components/Icons', () => ({
  Icons: {
    Edit: () => <div data-testid="edit-icon" />,
    Trash: () => <div data-testid="trash-icon" />,
  },
}));

// Mock the UI components from ui/Card
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardFooter: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

// Mock the Button component
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, variant, size, title, className }: any) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      title={title}
      className={className}
    >
      {children}
    </button>
  ),
}));

describe('PantryList Component', () => {
  const mockItems = [
    { id: '1', itemName: 'Eggs', category: 'Protein', notes: 'Organic, free-range' },
    { id: '2', itemName: 'Milk', category: 'Dairy', notes: 'Whole milk' },
    { id: '3', itemName: 'Bread', category: 'Grain' },
  ];

  const mockDeleteHandler = jest.fn();
  const mockEditHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all items correctly', () => {
    render(<PantryList items={mockItems} onDeleteItem={mockDeleteHandler} onEditItem={mockEditHandler} />);
    
    // Check if all item names are displayed
    expect(screen.getByText('Eggs')).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Bread')).toBeInTheDocument();
    
    // Check if categories are displayed
    expect(screen.getByText('Protein')).toBeInTheDocument();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Grain')).toBeInTheDocument();
    
    // Check if notes are displayed when available
    expect(screen.getByText('Organic, free-range')).toBeInTheDocument();
    expect(screen.getByText('Whole milk')).toBeInTheDocument();
  });

  test('calls onDeleteItem with correct id when delete button is clicked', () => {
    render(<PantryList items={mockItems} onDeleteItem={mockDeleteHandler} onEditItem={mockEditHandler} />);
    
    // Get all delete buttons (should be one per item)
    const deleteButtons = screen.getAllByTitle('Remove');
    expect(deleteButtons).toHaveLength(3);
    
    // Click the first delete button
    fireEvent.click(deleteButtons[0]);
    expect(mockDeleteHandler).toHaveBeenCalledWith('1');
    
    // Click the second delete button
    fireEvent.click(deleteButtons[1]);
    expect(mockDeleteHandler).toHaveBeenCalledWith('2');
  });

  test('renders empty grid when no items are provided', () => {
    render(<PantryList items={[]} onDeleteItem={mockDeleteHandler} onEditItem={mockEditHandler} />);
    const grid = document.querySelector('.grid.grid-cols-1');
    expect(grid).not.toBeNull();
    expect(grid?.children.length).toBe(0);
  });
}); 