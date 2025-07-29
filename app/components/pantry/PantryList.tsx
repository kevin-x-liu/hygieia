import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/Icons';
import { EditItemModal } from './EditItemModal';

interface PantryItem {
  id: string;
  itemName: string;
  category: string;
  notes?: string;
}

interface PantryListProps {
  items: PantryItem[];
  onDeleteItem: (id: string) => void;
  onEditItem: (updatedItem: PantryItem) => Promise<void>;
}

const categoryColors: { [key: string]: { bg: string; text: string } } = {
  Protein: { bg: 'bg-red-100', text: 'text-red-700' },
  Vegetable: { bg: 'bg-green-100', text: 'text-green-700' },
  Grain: { bg: 'bg-amber-100', text: 'text-amber-700' },
  Dairy: { bg: 'bg-sky-100', text: 'text-sky-700' },
  Other: { bg: 'bg-purple-100', text: 'text-purple-700' },
  Default: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

function PantryItemCard({
  item,
  onDeleteItem,
  onEditItem,
}: {
  item: PantryItem;
  onDeleteItem: (id: string) => void;
  onEditItem: (updatedItem: PantryItem) => Promise<void>;
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const color = categoryColors[item.category] || categoryColors['Default'];
  
  return (
    <Card className="transition-shadow duration-200 hover:shadow-lg flex flex-col h-full group">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold text-zinc-900">{item.itemName}</CardTitle>
          <span
            className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${color.bg} ${color.text}`}
          >
            {item.category}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {item.notes && <p className="mt-2 text-sm text-neutral-600">{item.notes}</p>}
      </CardContent>
      <CardFooter className="flex justify-between mt-auto">
        <Button 
          variant="outline" 
          size="icon" 
          title="Edit"
          onClick={() => setIsEditModalOpen(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Icons.Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => onDeleteItem(item.id)}
          title="Remove"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Icons.Trash className="h-4 w-4" />
        </Button>
      </CardFooter>
      
      <EditItemModal
        item={item}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={onEditItem}
      />
    </Card>
  );
}

export function PantryList({ items, onDeleteItem, onEditItem }: PantryListProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <PantryItemCard 
          key={item.id} 
          item={item} 
          onDeleteItem={onDeleteItem}
          onEditItem={onEditItem}
        />
      ))}
    </div>
  );
} 