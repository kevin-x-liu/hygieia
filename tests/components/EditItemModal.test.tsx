import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditItemModal } from '../../app/components/pantry/EditItemModal';

// Mock the UI components
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      data-variant={variant}
    >
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

jest.mock('@/components/Icons', () => ({
  Icons: {
    X: ({ className }: any) => <span className={className} data-testid="close-icon">X</span>
  }
}));

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  configurable: true
});

describe('EditItemModal Component', () => {
  const mockItem = {
    id: '1',
    itemName: 'Chicken Breast',
    category: 'Protein',
    notes: 'Fresh from store'
  };

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
    mockConfirm.mockReturnValue(true);
  });

  test('does not render when isOpen is false', () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByText('Edit Item')).not.toBeInTheDocument();
  });

  test('renders modal with form fields when isOpen is true', () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Edit Item')).toBeInTheDocument();
    expect(screen.getByLabelText('Item Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  test('populates form fields with item data when modal opens', () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const itemNameInput = screen.getByTestId('edit-item-name');
    const categorySelect = screen.getByDisplayValue('Protein');
    const notesInput = screen.getByTestId('edit-notes');

    expect(itemNameInput).toHaveValue('Chicken Breast');
    expect(categorySelect).toBeInTheDocument();
    expect(notesInput).toHaveValue('Fresh from store');
  });

  test('handles item with no notes correctly', () => {
    const itemWithoutNotes = {
      ...mockItem,
      notes: undefined
    };

    render(
      <EditItemModal
        item={itemWithoutNotes}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const notesInput = screen.getByTestId('edit-notes');
    expect(notesInput).toHaveValue('');
  });

  test('updates form fields when user types', () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const itemNameInput = screen.getByTestId('edit-item-name');
    const notesInput = screen.getByTestId('edit-notes');

    fireEvent.change(itemNameInput, { target: { value: 'Chicken Thigh' } });
    fireEvent.change(notesInput, { target: { value: 'Updated notes' } });

    expect(itemNameInput).toHaveValue('Chicken Thigh');
    expect(notesInput).toHaveValue('Updated notes');
  });

  test('calls onSave with updated data when save button is clicked', async () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const itemNameInput = screen.getByTestId('edit-item-name');
    const categorySelect = screen.getByDisplayValue('Protein');
    const notesInput = screen.getByTestId('edit-notes');

    fireEvent.change(itemNameInput, { target: { value: 'Salmon' } });
    fireEvent.change(categorySelect, { target: { value: 'Protein' } });
    fireEvent.change(notesInput, { target: { value: 'Fresh fish' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        id: '1',
        itemName: 'Salmon',
        category: 'Protein',
        notes: 'Fresh fish'
      });
    });
  });

  test('trims whitespace from item name and notes on save', async () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const itemNameInput = screen.getByTestId('edit-item-name');
    const notesInput = screen.getByTestId('edit-notes');

    fireEvent.change(itemNameInput, { target: { value: '  Salmon  ' } });
    fireEvent.change(notesInput, { target: { value: '  Fresh fish  ' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        id: '1',
        itemName: 'Salmon',
        category: 'Protein',
        notes: 'Fresh fish'
      });
    });
  });

  test('sets notes to undefined if empty after trimming', async () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const notesInput = screen.getByTestId('edit-notes');
    fireEvent.change(notesInput, { target: { value: '   ' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        id: '1',
        itemName: 'Chicken Breast',
        category: 'Protein',
        notes: undefined
      });
    });
  });

  test('does not save when item name is empty', async () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const itemNameInput = screen.getByTestId('edit-item-name');
    fireEvent.change(itemNameInput, { target: { value: '' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  test('does not save when item name is only whitespace', async () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const itemNameInput = screen.getByTestId('edit-item-name');
    fireEvent.change(itemNameInput, { target: { value: '   ' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  test('disables save button when item name is empty', () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const itemNameInput = screen.getByTestId('edit-item-name');
    fireEvent.change(itemNameInput, { target: { value: '' } });

    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeDisabled();
  });

  test('shows "Saving..." text while save is in progress', async () => {
    let resolveSave: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    mockOnSave.mockReturnValue(savePromise);

    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    // Complete the save
    resolveSave!();
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  test('disables buttons while save is in progress', async () => {
    let resolveSave: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    mockOnSave.mockReturnValue(savePromise);

    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText('Save Changes');
    const cancelButton = screen.getByText('Cancel');

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    resolveSave!();
  });

  test('calls onClose after successful save', async () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('handles save error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockOnSave.mockRejectedValue(new Error('Save failed'));

    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error saving item:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  test('calls onClose when cancel button is clicked without unsaved changes', () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  test('shows confirmation dialog when closing with unsaved changes', () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Make a change
    const itemNameInput = screen.getByTestId('edit-item-name');
    fireEvent.change(itemNameInput, { target: { value: 'Modified Name' } });

    // Try to close
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockConfirm).toHaveBeenCalledWith(
      'You have unsaved changes. Are you sure you want to close without saving?'
    );
    expect(mockOnClose).toHaveBeenCalled(); // Should close since confirm returns true
  });

  test('does not close when user cancels confirmation dialog', () => {
    mockConfirm.mockReturnValue(false);

    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Make a change
    const itemNameInput = screen.getByTestId('edit-item-name');
    fireEvent.change(itemNameInput, { target: { value: 'Modified Name' } });

    // Try to close
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('calls onClose when clicking backdrop without unsaved changes', () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const backdrop = document.querySelector('.absolute.inset-0.bg-black');
    fireEvent.click(backdrop!);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  test('shows confirmation when clicking backdrop with unsaved changes', () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Make a change
    const itemNameInput = screen.getByTestId('edit-item-name');
    fireEvent.change(itemNameInput, { target: { value: 'Modified Name' } });

    // Click backdrop
    const backdrop = document.querySelector('.absolute.inset-0.bg-black');
    fireEvent.click(backdrop!);

    expect(mockConfirm).toHaveBeenCalled();
  });

  test('calls onClose when clicking close icon', () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const closeIcon = screen.getByTestId('close-icon').parentElement;
    fireEvent.click(closeIcon!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('resets form when modal reopens with same item', () => {
    const { rerender } = render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Make changes
    const itemNameInput = screen.getByTestId('edit-item-name');
    fireEvent.change(itemNameInput, { target: { value: 'Modified Name' } });

    // Close modal
    rerender(
      <EditItemModal
        item={mockItem}
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Reopen modal
    rerender(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Form should be reset to original values
    expect(screen.getByTestId('edit-item-name')).toHaveValue('Chicken Breast');
  });

  test('renders all category options in select', () => {
    render(
      <EditItemModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const categorySelect = screen.getByDisplayValue('Protein');
    const options = categorySelect.querySelectorAll('option');

    expect(options).toHaveLength(5);
    expect(Array.from(options).map(option => option.textContent)).toEqual([
      'Protein', 'Vegetable', 'Grain', 'Dairy', 'Other'
    ]);
  });
});