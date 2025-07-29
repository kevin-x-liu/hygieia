import { NextRequest } from 'next/server';

// Mock NextAuth before importing anything that uses it
jest.mock('../../lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockUserFindUnique = jest.fn();
  const mockUserProfileFindUnique = jest.fn();
  const mockUserProfileUpsert = jest.fn();

  return {
    PrismaClient: jest.fn(() => ({
      user: { findUnique: mockUserFindUnique },
      userProfile: {
        findUnique: mockUserProfileFindUnique,
        upsert: mockUserProfileUpsert,
      },
    })),
    mockUserFindUnique,
    mockUserProfileFindUnique,
    mockUserProfileUpsert,
  };
});

// Mock encryption utilities
jest.mock('../../lib/encryption', () => ({
  encryptApiKey: jest.fn(),
  validateOpenAIApiKey: jest.fn(),
}));

// Import the mocked resources
const {
  mockUserFindUnique,
  mockUserProfileFindUnique,
  mockUserProfileUpsert,
} = jest.requireMock('@prisma/client');

const { auth } = jest.requireMock('../../lib/auth');
const { encryptApiKey, validateOpenAIApiKey } = jest.requireMock('../../lib/encryption');

// Mock NextResponse
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
import { GET, PUT } from '../../app/api/profile/route';

describe('Profile API Routes', () => {
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

  const mockProfile = {
    healthGoal: 'Weight Loss',
    dietaryPreferences: ['Vegetarian', 'Gluten-Free'],
    fitnessLevel: 'Intermediate',
    hasApiKey: true,
    updatedAt: new Date('2023-01-01T12:00:00Z')
  };

  beforeEach(() => {
    // Clear all mocks before each test
    auth.mockClear();
    mockUserFindUnique.mockClear();
    mockUserProfileFindUnique.mockClear();
    mockUserProfileUpsert.mockClear();
    encryptApiKey.mockClear();
    validateOpenAIApiKey.mockClear();

    // Mock auth to return a valid session
    auth.mockResolvedValue(mockSession);
    // Mock user lookup to return test user
    mockUserFindUnique.mockResolvedValue(mockUser);
    // Mock encryption utilities
    encryptApiKey.mockReturnValue('encrypted-api-key');
    validateOpenAIApiKey.mockReturnValue(true);
  });

  describe('GET /api/profile', () => {
    test('returns user profile when it exists', async () => {
      mockUserProfileFindUnique.mockResolvedValue(mockProfile);

      const response = await GET();

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        healthGoal: 'Weight Loss',
        dietaryPreferences: ['Vegetarian', 'Gluten-Free'],
        fitnessLevel: 'Intermediate',
        hasApiKey: true,
        updatedAt: '2023-01-01T12:00:00.000Z'
      });

      expect(mockUserProfileFindUnique).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        select: {
          healthGoal: true,
          dietaryPreferences: true,
          fitnessLevel: true,
          hasApiKey: true,
          updatedAt: true
        }
      });
    });

    test('returns default values when profile does not exist', async () => {
      mockUserProfileFindUnique.mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        healthGoal: '',
        dietaryPreferences: [],
        fitnessLevel: '',
        hasApiKey: false,
        updatedAt: null
      });
    });

    test('handles null values in existing profile', async () => {
      mockUserProfileFindUnique.mockResolvedValue({
        healthGoal: null,
        dietaryPreferences: null,
        fitnessLevel: null,
        hasApiKey: null,
        updatedAt: new Date('2023-01-01T12:00:00Z')
      });

      const response = await GET();

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        healthGoal: '',
        dietaryPreferences: [],
        fitnessLevel: '',
        hasApiKey: false,
        updatedAt: '2023-01-01T12:00:00.000Z'
      });
    });

    test('returns 401 when user not authenticated', async () => {
      auth.mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ message: 'Unauthorized' });
    });

    test('returns 401 when user not found in database', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ message: 'Unauthorized' });
    });

    test('returns 500 on database error', async () => {
      mockUserProfileFindUnique.mockRejectedValue(new Error('Database error'));

      const response = await GET();

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: 'Error fetching profile',
        error: expect.any(Error)
      });
    });
  });

  describe('PUT /api/profile', () => {
    const updateData = {
      healthGoal: 'Muscle Gain',
      dietaryPreferences: ['High Protein'],
      fitnessLevel: 'Advanced'
    };

    test('successfully updates profile without API key', async () => {
      const updatedProfile = {
        ...mockProfile,
        ...updateData,
        updatedAt: new Date('2023-01-02T12:00:00Z')
      };
      
      mockUserProfileUpsert.mockResolvedValue(updatedProfile);

      const request = new NextRequest('https://example.com/api/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        healthGoal: 'Muscle Gain',
        dietaryPreferences: ['High Protein'],
        fitnessLevel: 'Advanced',
        hasApiKey: true,
        updatedAt: '2023-01-02T12:00:00.000Z',
        message: 'Profile updated successfully'
      });

      expect(mockUserProfileUpsert).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        update: {
          healthGoal: 'Muscle Gain',
          dietaryPreferences: ['High Protein'],
          fitnessLevel: 'Advanced',
          updatedAt: expect.any(Date)
        },
        create: {
          userId: mockUser.id,
          healthGoal: 'Muscle Gain',
          dietaryPreferences: ['High Protein'],
          fitnessLevel: 'Advanced'
        },
        select: {
          healthGoal: true,
          dietaryPreferences: true,
          fitnessLevel: true,
          hasApiKey: true,
          updatedAt: true
        }
      });
    });

    test('successfully updates profile with API key', async () => {
      const dataWithApiKey = {
        ...updateData,
        apiKey: 'sk-test-api-key'
      };

      const updatedProfile = {
        ...mockProfile,
        ...updateData,
        hasApiKey: true,
        updatedAt: new Date('2023-01-02T12:00:00Z')
      };

      mockUserProfileUpsert.mockResolvedValue(updatedProfile);

      const request = new NextRequest('https://example.com/api/profile', {
        method: 'PUT',
        body: JSON.stringify(dataWithApiKey),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(encryptApiKey).toHaveBeenCalledWith('sk-test-api-key');
      expect(mockUserProfileUpsert).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        update: {
          healthGoal: 'Muscle Gain',
          dietaryPreferences: ['High Protein'],
          fitnessLevel: 'Advanced',
          openaiApiKeyHash: 'encrypted-api-key',
          hasApiKey: true,
          updatedAt: expect.any(Date)
        },
        create: {
          userId: mockUser.id,
          healthGoal: 'Muscle Gain',
          dietaryPreferences: ['High Protein'],
          fitnessLevel: 'Advanced',
          openaiApiKeyHash: 'encrypted-api-key',
          hasApiKey: true
        },
        select: {
          healthGoal: true,
          dietaryPreferences: true,
          fitnessLevel: true,
          hasApiKey: true,
          updatedAt: true
        }
      });
    });

    test('handles empty/null values correctly', async () => {
      const emptyData = {
        healthGoal: '',
        dietaryPreferences: [],
        fitnessLevel: ''
      };

      mockUserProfileUpsert.mockResolvedValue({
        healthGoal: null,
        dietaryPreferences: [],
        fitnessLevel: null,
        hasApiKey: false,
        updatedAt: new Date('2023-01-02T12:00:00Z')
      });

      const request = new NextRequest('https://example.com/api/profile', {
        method: 'PUT',
        body: JSON.stringify(emptyData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(mockUserProfileUpsert).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        update: {
          healthGoal: null,
          dietaryPreferences: [],
          fitnessLevel: null,
          updatedAt: expect.any(Date)
        },
        create: {
          userId: mockUser.id,
          healthGoal: null,
          dietaryPreferences: [],
          fitnessLevel: null
        },
        select: {
          healthGoal: true,
          dietaryPreferences: true,
          fitnessLevel: true,
          hasApiKey: true,
          updatedAt: true
        }
      });
    });

    test('returns 400 when dietaryPreferences is not an array', async () => {
      const invalidData = {
        ...updateData,
        dietaryPreferences: 'not-an-array'
      };

      const request = new NextRequest('https://example.com/api/profile', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: 'dietaryPreferences must be an array'
      });
      expect(mockUserProfileUpsert).not.toHaveBeenCalled();
    });

    test('returns 400 when API key format is invalid', async () => {
      validateOpenAIApiKey.mockReturnValue(false);

      const dataWithInvalidApiKey = {
        ...updateData,
        apiKey: 'invalid-key-format'
      };

      const request = new NextRequest('https://example.com/api/profile', {
        method: 'PUT',
        body: JSON.stringify(dataWithInvalidApiKey),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: 'Invalid OpenAI API key format'
      });
      expect(mockUserProfileUpsert).not.toHaveBeenCalled();
    });

    test('returns 500 when API key encryption fails', async () => {
      encryptApiKey.mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      const dataWithApiKey = {
        ...updateData,
        apiKey: 'sk-test-api-key'
      };

      const request = new NextRequest('https://example.com/api/profile', {
        method: 'PUT',
        body: JSON.stringify(dataWithApiKey),
      });

      const response = await PUT(request);

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: 'Failed to encrypt API key'
      });
    });

    test('returns 401 when user not authenticated', async () => {
      auth.mockResolvedValue(null);

      const request = new NextRequest('https://example.com/api/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ message: 'Unauthorized' });
    });

    test('returns 500 on database error', async () => {
      mockUserProfileUpsert.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('https://example.com/api/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: 'Error updating profile',
        error: expect.any(Error)
      });
    });
  });
});