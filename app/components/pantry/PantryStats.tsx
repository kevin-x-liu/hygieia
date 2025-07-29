/**
 * PantryStats Component - Displays statistics about pantry items
 * 
 * This client component fetches statistics from the API and displays
 * them in a grid of cards. Each card shows a different statistic.
 */
'use client'; // This directive is needed for using React hooks

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { usePantryContext } from '../../lib/hooks/usePantryContext';

// TypeScript interface for the statistics from the API
interface PantryStats {
  totalItems: number;
  categoryCounts: {
    [category: string]: number;
  };
}

export function PantryStats() {
  // Access the pantry context to detect changes
  const { triggerUpdate } = usePantryContext();
  
  // State to hold the fetched statistics
  const [stats, setStats] = useState<{ name: string; value: number }[]>([
    { name: 'Total Items', value: 0 },
    { name: 'Proteins', value: 0 },
    { name: 'Vegetables', value: 0 },
    { name: 'Grains', value: 0 },
    { name: 'Dairy', value: 0 },
    { name: 'Other', value: 0 },
  ]);
  
  // State for tracking loading status
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch stats function (memoized with useCallback)
  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      // Call the API endpoint with stats=true query parameter
      const response = await fetch('/api/pantry?stats=true');
      const data: PantryStats = await response.json();
      
      // Transform the API response into the format needed for display
      const newStats = [
        { name: 'Total Items', value: data.totalItems },
        { name: 'Proteins', value: data.categoryCounts['Protein'] || 0 },
        { name: 'Vegetables', value: data.categoryCounts['Vegetable'] || 0 },
        { name: 'Grains', value: data.categoryCounts['Grain'] || 0 },
        { name: 'Dairy', value: data.categoryCounts['Dairy'] || 0 },
        { name: 'Other', value: data.categoryCounts['Other'] || 0 },
      ];
      
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching pantry stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch statistics when the component mounts or when triggerUpdate changes
  // This ensures the stats refresh whenever items are added/deleted
  useEffect(() => {
    fetchStats();
  }, [fetchStats, triggerUpdate]); // Depend on triggerUpdate to refresh when items change

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.name} className="bg-green-100 border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {stat.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-700">
              {isLoading ? '...' : stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 