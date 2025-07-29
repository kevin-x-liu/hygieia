import { NextRequest } from 'next/server';

// Mock the auth-utils before importing anything that uses it
jest.mock('../../lib/auth-utils', () => ({
  createUser: jest.fn(),
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
}));

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

// Import the mocked functions
const { createUser, validateEmail, validatePassword } = jest.requireMock('../../lib/auth-utils');

// Import the route handler after mocking
import { POST } from '../../app/api/register/route';

describe('Register API Route', () => {
  const validUserData = {
    email: 'test@example.com',
    password: 'StrongPass123!',
    confirmPassword: 'StrongPass123!'
  };

  const mockCreatedUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    createUser.mockClear();
    validateEmail.mockClear();
    validatePassword.mockClear();

    // Set default mock implementations
    validateEmail.mockReturnValue(true);
    validatePassword.mockReturnValue({ isValid: true, errors: [] });
    createUser.mockResolvedValue(mockCreatedUser);
  });

  describe('POST /api/register', () => {
    test('successfully creates a user with valid data', async () => {
      const request = new NextRequest('https://example.com/api/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({
        message: 'User created successfully',
        user: mockCreatedUser
      });
      
      expect(validateEmail).toHaveBeenCalledWith('test@example.com');
      expect(validatePassword).toHaveBeenCalledWith('StrongPass123!');
      expect(createUser).toHaveBeenCalledWith('test@example.com', 'StrongPass123!');
    });

    test('returns 400 when required fields are missing', async () => {
      const invalidData = { email: 'test@example.com' }; // missing password and confirmPassword

      const request = new NextRequest('https://example.com/api/register', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: 'Email, password, and password confirmation are required'
      });
      expect(createUser).not.toHaveBeenCalled();
    });

    test('returns 400 when email is invalid', async () => {
      validateEmail.mockReturnValue(false);

      const request = new NextRequest('https://example.com/api/register', {
        method: 'POST',
        body: JSON.stringify({
          ...validUserData,
          email: 'invalid-email'
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: 'Please enter a valid email address'
      });
      expect(createUser).not.toHaveBeenCalled();
    });

    test('returns 400 when password is weak', async () => {
      validatePassword.mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters', 'Password must contain uppercase letter']
      });

      const request = new NextRequest('https://example.com/api/register', {
        method: 'POST',
        body: JSON.stringify({
          ...validUserData,
          password: 'weak',
          confirmPassword: 'weak'
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: 'Password must be at least 8 characters, Password must contain uppercase letter'
      });
      expect(createUser).not.toHaveBeenCalled();
    });

    test('returns 400 when passwords do not match', async () => {
      const request = new NextRequest('https://example.com/api/register', {
        method: 'POST',
        body: JSON.stringify({
          ...validUserData,
          confirmPassword: 'DifferentPassword123!'
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: 'Passwords do not match'
      });
      expect(createUser).not.toHaveBeenCalled();
    });

    test('returns 409 when user already exists', async () => {
      createUser.mockRejectedValue(new Error('User with this email already exists'));

      const request = new NextRequest('https://example.com/api/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });

      const response = await POST(request);

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({
        error: 'An account with this email already exists'
      });
    });

    test('returns 500 for other errors during user creation', async () => {
      createUser.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('https://example.com/api/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: 'An error occurred during registration'
      });
    });

    test('trims and lowercases email before processing', async () => {
      const request = new NextRequest('https://example.com/api/register', {
        method: 'POST',
        body: JSON.stringify({
          ...validUserData,
          email: '  TEST@EXAMPLE.COM  '
        }),
      });

      await POST(request);

      expect(createUser).toHaveBeenCalledWith('test@example.com', 'StrongPass123!');
    });
  });
});