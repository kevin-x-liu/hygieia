import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddItemForm } from '../../app/components/pantry/AddItemForm';

// Mock the UI components
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, type, className }: any) => (
    <button onClick={onClick} type={type} className={className}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/Input', () => ({
  Input: ({ id, placeholder, value, onChange }: any) => (
    <input
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      data-testid={id}
    />
  ),
}));

jest.mock('@/components/ui/Label', () => ({
  Label: ({ htmlFor, children }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

describe('AddItemForm Component', () => {
  const mockAddItem = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form with all input fields', () => {
    render(<AddItemForm onAddItem={mockAddItem} />);
    
    // Check if input fields and their labels are rendered
    expect(screen.getByLabelText('Item Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes (Optional)')).toBeInTheDocument();
    
    // Check if button is rendered
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  test('calls onAddItem with form data when submitted with valid inputs', () => {
    render(<AddItemForm onAddItem={mockAddItem} />);
    
    // Fill in the form
    const itemNameInput = screen.getByTestId('item-name');
    fireEvent.change(itemNameInput, { target: { value: 'Apple' } });
    
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'Vegetable' } });
    
    const notesInput = screen.getByTestId('notes');
    fireEvent.change(notesInput, { target: { value: 'Fresh from the market' } });
    
    // Submit the form
    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);
    
    // Check if onAddItem was called with the correct data
    expect(mockAddItem).toHaveBeenCalledWith({
      itemName: 'Apple',
      category: 'Vegetable',
      notes: 'Fresh from the market'
    });
  });

  test('does not submit form when item name is empty', () => {
    render(<AddItemForm onAddItem={mockAddItem} />);
    
    // Leave itemName empty
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'Dairy' } });
    
    // Submit the form
    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);
    
    // Check that onAddItem was not called
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  test('resets form fields after successful submission', () => {
    render(<AddItemForm onAddItem={mockAddItem} />);
    
    // Fill in the form
    const itemNameInput = screen.getByTestId('item-name');
    fireEvent.change(itemNameInput, { target: { value: 'Bananas' } });
    
    const notesInput = screen.getByTestId('notes');
    fireEvent.change(notesInput, { target: { value: 'Yellow ones' } });
    
    // Submit the form
    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);
    
    // Check if form fields were reset
    expect(itemNameInput).toHaveValue('');
    expect(notesInput).toHaveValue('');
  });
}); 