'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icons } from '@/components/Icons';

const filters = ['All Items', 'Protein', 'Vegetable', 'Grain', 'Dairy', 'Other'];

interface FilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function FilterTabs({ activeFilter, onFilterChange, searchQuery = '', onSearchChange }: FilterTabsProps) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'default' : 'outline'}
              onClick={() => onFilterChange(filter)}
              className={
                activeFilter === filter
                  ? 'bg-green-700 text-white hover:bg-green-800'
                  : 'border-neutral-200 bg-white text-zinc-900 hover:bg-neutral-100'
              }
            >
              {filter}
            </Button>
          ))}
        </div>
        
        {onSearchChange && (
          <div className="relative w-full sm:w-auto">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              className="w-full sm:w-64 pl-10" 
              placeholder="Search your pantry..." 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
} 