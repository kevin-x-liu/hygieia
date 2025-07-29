import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Icons } from '@/components/Icons';

interface PantryItem {
  id: string;
  itemName: string;
  category: string;
  notes?: string;
}

interface EditItemModalProps {
  item: PantryItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: PantryItem) => Promise<void>;
}

const categories = ['Protein', 'Vegetable', 'Grain', 'Dairy', 'Other'];

export function EditItemModal({ item, isOpen, onClose, onSave }: EditItemModalProps) {
  const [itemName, setItemName] = useState(item.itemName);
  const [category, setCategory] = useState(item.category);
  const [notes, setNotes] = useState(item.notes || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when item changes OR when modal opens
  useEffect(() => {
    if (isOpen) {
      setItemName(item.itemName);
      setCategory(item.category);
      setNotes(item.notes || '');
      setHasUnsavedChanges(false);
    }
  }, [item, isOpen]);

  // Check for unsaved changes whenever form values change
  useEffect(() => {
    const hasChanges = 
      itemName !== item.itemName ||
      category !== item.category ||
      notes !== (item.notes || '');
    setHasUnsavedChanges(hasChanges);
  }, [itemName, category, notes, item]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const shouldClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!shouldClose) return;
    }
    onClose();
  };

  const handleSave = async () => {
    if (!itemName.trim() || !category.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave({
        ...item,
        itemName: itemName.trim(),
        category,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-zinc-900">Edit Item</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <Icons.X className="h-6 w-6 text-zinc-900" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-item-name">Item Name</Label>
            <Input
              id="edit-item-name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Chicken Breast"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-zinc-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes (Optional)</Label>
            <Input
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Expires next week"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!itemName.trim() || !category.trim() || isSaving}
            className={hasUnsavedChanges ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
} 