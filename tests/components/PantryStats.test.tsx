import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PantryStats } from '../../app/components/pantry/PantryStats';

// Mock the UI Card components
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="stats-card">
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children, className }: any) => (
    <div className={className} data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 className={className} data-testid="card-title">{children}</h3>
  ),
}));

// Mock the pantry context - updated path
const mockUsePantryContext = jest.fn();
jest.mock('../../app/lib/hooks/usePantryContext', () => ({
  usePantryContext: () => mockUsePantryContext(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('PantryStats Component', () => {
  const mockStatsResponse = {
    totalItems: 10,
    categoryCounts: {
      'Protein': 3,
      'Vegetable': 4,
      'Grain': 2,
      'Dairy': 1,
      'Other': 0
    }
  };

  let mockTriggerUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new function reference for each test
    mockTriggerUpdate = jest.fn();
    
    // Mock the pantry context
    mockUsePantryContext.mockReturnValue({
      triggerUpdate: mockTriggerUpdate
    });

    // Mock successful fetch response
    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockStatsResponse),
    });
  });

  test('renders all stat cards with correct initial structure', async () => {
    render(<PantryStats />);

    await waitFor(() => {
      const cards = screen.getAllByTestId('stats-card');
      expect(cards).toHaveLength(6);
    });

    // Check that all expected stat categories are present
    expect(screen.getByText('Total Items')).toBeInTheDocument();
    expect(screen.getByText('Proteins')).toBeInTheDocument();
    expect(screen.getByText('Vegetables')).toBeInTheDocument();
    expect(screen.getByText('Grains')).toBeInTheDocument();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    render(<PantryStats />);

    // Initially should show loading dots
    const loadingElements = screen.getAllByText('...');
    expect(loadingElements).toHaveLength(6);
  });

  test('fetches stats from API with correct parameters', async () => {
    render(<PantryStats />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/pantry?stats=true');
    });
  });

  test('displays correct stats after successful fetch', async () => {
    render(<PantryStats />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // Total Items
      expect(screen.getByText('3')).toBeInTheDocument();  // Proteins
      expect(screen.getByText('4')).toBeInTheDocument();  // Vegetables
      expect(screen.getByText('2')).toBeInTheDocument();  // Grains
      expect(screen.getByText('1')).toBeInTheDocument();  // Dairy
      expect(screen.getByText('0')).toBeInTheDocument();  // Other
    });
  });

  test('handles missing category counts gracefully', async () => {
    const partialStatsResponse = {
      totalItems: 5,
      categoryCounts: {
        'Protein': 2,
        'Vegetable': 3,
        // Missing Grain, Dairy, Other categories
      }
    };

    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(partialStatsResponse),
    });

    render(<PantryStats />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();  // Total Items
      expect(screen.getByText('2')).toBeInTheDocument();  // Proteins
      expect(screen.getByText('3')).toBeInTheDocument();  // Vegetables
    });

    // Missing categories should show 0
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(3); // Grains, Dairy, Other
  });

  test('refetches stats when triggerUpdate changes', async () => {
    const { rerender } = render(<PantryStats />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Create a new triggerUpdate function reference to simulate context change
    const newTriggerUpdate = jest.fn();
    mockUsePantryContext.mockReturnValue({
      triggerUpdate: newTriggerUpdate
    });

    rerender(<PantryStats />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  test('handles fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockFetch.mockRejectedValue(new Error('Fetch error'));

    render(<PantryStats />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching pantry stats:',
        expect.any(Error)
      );
    });

    // Should still show the cards with loading stopped
    const cards = screen.getAllByTestId('stats-card');
    expect(cards).toHaveLength(6);

    // Loading should have stopped, showing initial values (0)
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThan(0);

    consoleSpy.mockRestore();
  });

  test('handles network error during fetch', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockFetch.mockRejectedValue(new TypeError('Network error'));

    render(<PantryStats />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching pantry stats:',
        expect.any(TypeError)
      );
    });

    consoleSpy.mockRestore();
  });

  test('handles invalid JSON response', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockFetch.mockResolvedValue({
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
    });

    render(<PantryStats />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching pantry stats:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  test('displays stats with correct styling', async () => {
    render(<PantryStats />);

    await waitFor(() => {
      const cards = screen.getAllByTestId('stats-card');
      cards.forEach(card => {
        expect(card).toHaveClass('bg-green-100', 'border-0', 'shadow-none');
      });
    });

    const cardTitles = screen.getAllByTestId('card-title');
    cardTitles.forEach(title => {
      expect(title).toHaveClass('text-sm', 'font-medium', 'text-neutral-600');
    });
  });

  test('shows correct grid layout classes', () => {
    const { container } = render(<PantryStats />);

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass(
      'grid-cols-1',
      'gap-4',
      'sm:grid-cols-2',
      'lg:grid-cols-6'
    );
  });

  test('updates loading state correctly during fetch', async () => {
    let resolvePromise: (value: any) => void;
    const fetchPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValue(fetchPromise);

    render(<PantryStats />);

    // Should show loading initially
    expect(screen.getAllByText('...')).toHaveLength(6);

    // Resolve the fetch
    resolvePromise!({
      json: jest.fn().mockResolvedValue(mockStatsResponse)
    });

    await waitFor(() => {
      // Loading should be gone, actual numbers should appear
      expect(screen.queryByText('...')).not.toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  test('handles empty stats response', async () => {
    const emptyStatsResponse = {
      totalItems: 0,
      categoryCounts: {}
    };

    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(emptyStatsResponse),
    });

    render(<PantryStats />);

    await waitFor(() => {
      // All values should be 0
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements).toHaveLength(6);
    });
  });

  test('maintains consistent order of stats', async () => {
    render(<PantryStats />);

    await waitFor(() => {
      const cardTitles = screen.getAllByTestId('card-title');
      const titleTexts = cardTitles.map(title => title.textContent);
      
      expect(titleTexts).toEqual([
        'Total Items',
        'Proteins',
        'Vegetables',
        'Grains',
        'Dairy',
        'Other'
      ]);
    });
  });

  test('does not fetch stats on component unmount', async () => {
    const { unmount } = render(<PantryStats />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Wait a bit to ensure no additional calls
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('handles rapid triggerUpdate changes', async () => {
    const { rerender } = render(<PantryStats />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Rapidly change triggerUpdate with different function references
    for (let i = 0; i < 3; i++) {
      const newTriggerUpdate = jest.fn();
      mockUsePantryContext.mockReturnValue({
        triggerUpdate: newTriggerUpdate
      });
      rerender(<PantryStats />);
    }

    await waitFor(() => {
      // Should have made calls for each update
      expect(mockFetch).toHaveBeenCalledTimes(4); // Initial + 3 updates
    });
  });
});