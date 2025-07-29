/**
 * Pantry Page Component - Renders the /pantry route
 * 
 * This page demonstrates a full Next.js client component that:
 * - Fetches data from an API route
 * - Manages local state
 * - Composes multiple UI components
 * - Handles filtering and search functionality
 */
'use client'; // This makes it a client component that runs in the browser

import React, { useState, useEffect } from 'react';
import { AddItemForm } from '../components/pantry/AddItemForm';
import { FilterTabs } from '../components/pantry/FilterTabs';
import { PantryList } from '../components/pantry/PantryList';
import { PantryStats } from '../components/pantry/PantryStats';
import Icons from '../components/Icons';
import { PantryContext } from '../lib/hooks/usePantryContext';

// TypeScript interface to define the shape of pantry items
interface PantryItem {
  id: string;
  itemName: string;
  category: string;
  notes?: string; // Optional field
}

export default function PantryPage() {
  // State management for the pantry page using React hooks
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]); // Stores all pantry items
  const [activeFilter, setActiveFilter] = useState('All Items');    // Tracks the active category filter
  const [searchQuery, setSearchQuery] = useState('');               // Tracks the search input
  const [updateCounter, setUpdateCounter] = useState(0);            // Used to trigger rerenders

  // Function to trigger updates across components
  const triggerUpdate = () => setUpdateCounter(prev => prev + 1);

  // useEffect hook to fetch data when the component mounts or updateCounter changes
  useEffect(() => {
    const fetchPantryItems = async () => {
      // Call our Next.js API route to get pantry items
      const response = await fetch('/api/pantry');
      const items = await response.json();
      setPantryItems(items);
    };
    fetchPantryItems();
  }, [updateCounter]); // Dependency on updateCounter ensures refetch when it changes

  // Handler for adding a new pantry item
  const handleAddItem = async (item: Omit<PantryItem, 'id'>) => {
    // Send POST request to the API route
    const response = await fetch('/api/pantry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    // Add the newly created item (with server-generated ID) to the state
    const newItem = await response.json();
    setPantryItems((prevItems) => [...prevItems, newItem]);
    
    // Trigger update for stats and other components
    triggerUpdate();
  };

  // Handler for deleting a pantry item
  const handleDeleteItem = async (id: string) => {
    // Send DELETE request to the API route
    await fetch('/api/pantry', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    // Remove the deleted item from the local state
    setPantryItems((prevItems) => prevItems.filter((item) => item.id !== id));
    
    // Trigger update for stats and other components
    triggerUpdate();
  };

  // Handler for editing a pantry item
  const handleEditItem = async (updatedItem: PantryItem) => {
    // Send PUT request to the API route
    const response = await fetch('/api/pantry', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem),
    });
    
    if (response.ok) {
      const savedItem = await response.json();
      // Update the item in the local state
      setPantryItems((prevItems) => 
        prevItems.map((item) => 
          item.id === savedItem.id ? savedItem : item
        )
      );
      
      // Trigger update for stats and other components
      triggerUpdate();
    }
  };

  // Filter the items based on category and search query
  // This is computed on each render based on the current state
  const filteredItems = pantryItems.filter((item) => {
    // First filter by category
    if (activeFilter !== 'All Items' && item.category !== activeFilter) {
      return false;
    }
    
    // Then filter by search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.itemName.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.notes && item.notes.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // The UI for the pantry page using Tailwind CSS for styling
  return (
    <PantryContext.Provider value={{ triggerUpdate }}>
      <div className="min-h-screen">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          {/* Page header with icon and title */}
          <header className="mb-8 text-center">
            <div className="inline-block rounded-full bg-green-100 p-4">
              <Icons.Salad className="h-12 w-12 text-green-700" />
            </div>
            <h1 className="mt-4 text-5xl font-extrabold text-zinc-900">
              Pantry Management
            </h1>
            <p className="mt-2 text-lg text-neutral-600">
              Manage your ingredients and let AI create amazing meals for you
            </p>
          </header>

          <main>
            {/* Statistics component showing overall pantry metrics */}
            <PantryStats />
            
            {/* Form for adding new pantry items */}
            <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
              <AddItemForm onAddItem={handleAddItem} />
            </div>
            
            {/* Filter tabs and search functionality */}
            <div className="mt-8">
              <FilterTabs
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
              {/* List of pantry items that updates based on filters */}
              <PantryList 
                items={filteredItems} 
                onDeleteItem={handleDeleteItem}
                onEditItem={handleEditItem}
              />
            </div>
          </main>
        </div>
      </div>
    </PantryContext.Provider>
  );
} 