'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface AddItemFormProps {
  onAddItem: (item: {
    itemName: string;
    category: string;
    notes?: string;
  }) => void;
}

const categories = ['Protein', 'Vegetable', 'Grain', 'Dairy', 'Other'];

export function AddItemForm({ onAddItem }: AddItemFormProps) {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState(categories[0]); // Default to the first category
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !category.trim()) return;
    onAddItem({ itemName, category, notes });
    setItemName('');
    setCategory(categories[0]);
    setNotes('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end"
    >
      <div className="flex-grow space-y-2">
        <Label htmlFor="item-name">Item Name</Label>
        <Input
          id="item-name"
          placeholder="e.g., Chicken Breast"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
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
      <div className="flex-grow space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          placeholder="e.g., Expires next week"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="sm:shrink-0">
        <Button
          type="submit"
          className="w-full bg-green-700 hover:bg-green-800 sm:w-auto"
        >
          Add Item
        </Button>
      </div>
    </form>
  );
} 