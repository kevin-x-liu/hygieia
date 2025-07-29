import { NextRequest } from 'next/server';

// Mock NextAuth before importing anything that uses it
jest.mock('../../lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock Prisma Client import
jest.mock('@prisma/client', () => {
  const mockUserFindUnique = jest.fn();
  const mockPantryItemFindMany = jest.fn();
  const mockPantryItemCreate = jest.fn();
  const mockPantryItemDelete = jest.fn();

  return {
    PrismaClient: jest.fn(() => ({
      user: { findUnique: mockUserFindUnique },
      pantryItem: {
        findMany: mockPantryItemFindMany,
        create: mockPantryItemCreate,
        delete: mockPantryItemDelete,
      },
    })),
    // Export mocks for use in tests
    mockUserFindUnique,
    mockPantryItemFindMany,
    mockPantryItemCreate,
    mockPantryItemDelete,
  };
});

// Import the mocked resources
const {
  mockUserFindUnique,
  mockPantryItemFindMany,
  mockPantryItemCreate,
  mockPantryItemDelete,
} = jest.requireMock('@prisma/client');

// Import the auth mock
const { auth } = jest.requireMock('../../lib/auth');

// Mock NextResponse before importing route handlers
jest.mock('next/server', () => {
  return {
    ...jest.requireActual('next/server'),
    NextResponse: {
      json: jest.fn().mockImplementation((body, options) => ({
        status: options?.status || 200,
        body,
        json: async () => body
      }))
    }
  };
});

// Import route handlers after mocking
import { GET, POST, DELETE } from '../../app/api/pantry/route';

describe('Pantry API Routes', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  };

  const mockSession = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com'
    }
  };

  beforeEach(() => {
    // Clear all mocks before each test
    auth.mockClear();
    mockUserFindUnique.mockClear();
    mockPantryItemFindMany.mockClear();
    mockPantryItemCreate.mockClear();
    mockPantryItemDelete.mockClear();

    // Mock auth to return a valid session
    auth.mockResolvedValue(mockSession);
    // Mock user lookup to return test user for most tests
    mockUserFindUnique.mockResolvedValue(mockUser);
  });

  describe('GET /api/pantry', () => {
    const mockPantryItems = [
      { 
        id: '1', 
        itemName: 'Eggs', 
        category: 'Protein',
        notes: null,
        addedAt: new Date('2023-01-01T00:00:00Z')
      },
      { 
        id: '2', 
        itemName: 'Spinach', 
        category: 'Vegetable',
        notes: null,
        addedAt: new Date('2023-01-02T00:00:00Z')
      },
    ];

    test('returns all pantry items', async () => {
      // Mock the Prisma query
      mockPantryItemFindMany.mockResolvedValue(mockPantryItems);
      
      // Create request
      const request = new NextRequest('https://example.com/api/pantry');
      
      // Call the API handler
      const response = await GET(request);
      const data = await response.json();
      
      // Check if the correct data was returned (formatted)
      expect(data).toEqual([
        {
          id: '1',
          itemName: 'Eggs',
          category: 'Protein',
          addedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          itemName: 'Spinach',
          category: 'Vegetable',
          addedAt: '2023-01-02T00:00:00.000Z'
        }
      ]);
      expect(mockPantryItemFindMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { addedAt: 'desc' },
        select: {
          id: true,
          itemName: true,
          category: true,
          notes: true,
          addedAt: true
        }
      });
    });

    test('returns stats when stats=true query parameter is provided', async () => {
      // Mock the Prisma query for stats
      mockPantryItemFindMany.mockResolvedValue([
        { category: 'Protein' },
        { category: 'Vegetable' }
      ]);
      
      // Create request with query parameter
      const request = new NextRequest('https://example.com/api/pantry?stats=true');
      
      // Call the API handler
      const response = await GET(request);
      const stats = await response.json();
      
      // Check if stats were calculated correctly
      expect(stats).toEqual({
        totalItems: 2,
        categoryCounts: {
          'Protein': 1,
          'Vegetable': 1
        }
      });
    });

    test('returns 401 if user not authenticated', async () => {
      // Mock no session
      auth.mockResolvedValue(null);
      
      const request = new NextRequest('https://example.com/api/pantry');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ message: 'Unauthorized' });
    });

    test('returns 401 if user not found in database', async () => {
      // Mock user not found in database (but session exists)
      mockUserFindUnique.mockResolvedValue(null);
      
      const request = new NextRequest('https://example.com/api/pantry');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ message: 'Unauthorized' });
    });
  });

  describe('POST /api/pantry', () => {
    const newItem = { itemName: 'Apple', category: 'Fruit', notes: 'Red delicious' };
    const createdItem = { 
      id: '3', 
      itemName: 'Apple', 
      category: 'Fruit', 
      notes: 'Red delicious',
      addedAt: new Date('2023-01-03T00:00:00Z')
    };

    test('adds a new pantry item', async () => {
      // Mock the Prisma create
      mockPantryItemCreate.mockResolvedValue(createdItem);
      
      // Create request with body
      const request = new NextRequest('https://example.com/api/pantry', {
        method: 'POST',
        body: JSON.stringify(newItem),
      });
      
      // Call the API handler
      const response = await POST(request);
      
      // Check if the item was added correctly
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({
        id: '3',
        itemName: 'Apple',
        category: 'Fruit',
        notes: 'Red delicious',
        addedAt: '2023-01-03T00:00:00.000Z'
      });
      expect(mockPantryItemCreate).toHaveBeenCalledWith({
        data: {
          itemName: 'Apple',
          category: 'Fruit',
          notes: 'Red delicious',
          userId: mockUser.id
        },
        select: {
          id: true,
          itemName: true,
          category: true,
          notes: true,
          addedAt: true
        }
      });
    });

    test('returns 400 if required fields are missing', async () => {
      // Create request with invalid body
      const request = new NextRequest('https://example.com/api/pantry', {
        method: 'POST',
        body: JSON.stringify({ notes: 'Missing required fields' }),
      });
      
      // Call the API handler
      const response = await POST(request);
      
      // Check if the response is a 400 error
      expect(response.status).toBe(400);
      expect(mockPantryItemCreate).not.toHaveBeenCalled();
    });

    test('returns 401 if user not authenticated', async () => {
      // Mock no session
      auth.mockResolvedValue(null);
      
      const request = new NextRequest('https://example.com/api/pantry', {
        method: 'POST',
        body: JSON.stringify(newItem),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ message: 'Unauthorized' });
      expect(mockPantryItemCreate).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/pantry', () => {
    test('deletes an existing pantry item', async () => {
      // Mock successful delete
      mockPantryItemDelete.mockResolvedValue({});
      
      // Create request with body
      const request = new NextRequest('https://example.com/api/pantry', {
        method: 'DELETE',
        body: JSON.stringify({ id: '1' }),
      });
      
      // Call the API handler
      const response = await DELETE(request);
      const data = await response.json();
      
      // Check if the item was deleted correctly
      expect(response.status).toBe(200);
      expect(data).toEqual({ message: 'Item deleted successfully' });
      expect(mockPantryItemDelete).toHaveBeenCalledWith({
        where: { 
          id: '1',
          userId: mockUser.id
        }
      });
    });

    test('returns 404 if item does not exist', async () => {
      // Mock Prisma P2025 error (record not found)
      const notFoundError = new Error('Record not found');
      (notFoundError as any).code = 'P2025';
      mockPantryItemDelete.mockRejectedValue(notFoundError);
      
      // Create request with body
      const request = new NextRequest('https://example.com/api/pantry', {
        method: 'DELETE',
        body: JSON.stringify({ id: 'nonexistent' }),
      });
      
      // Call the API handler
      const response = await DELETE(request);
      
      // Check if the response is a 404 error
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ message: 'Item not found' });
    });

    test('returns 500 on other errors during delete', async () => {
      // Mock a generic error
      mockPantryItemDelete.mockRejectedValue(new Error('Test error'));
      
      const request = new NextRequest('https://example.com/api/pantry', {
        method: 'DELETE',
        body: JSON.stringify({ id: '1' }),
      });
      
      const response = await DELETE(request);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ message: 'Error deleting item' });
    });

    test('returns 401 if user not authenticated', async () => {
      // Mock no session
      auth.mockResolvedValue(null);
      
      const request = new NextRequest('https://example.com/api/pantry', {
        method: 'DELETE',
        body: JSON.stringify({ id: '1' }),
      });
      
      const response = await DELETE(request);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ message: 'Unauthorized' });
      expect(mockPantryItemDelete).not.toHaveBeenCalled();
    });
  });
}); 