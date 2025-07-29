/**
 * Profile API Route Handler - Manages user profile operations
 * 
 * In Next.js App Router:
 * - This file handles requests to /api/profile
 * - It provides GET and PUT endpoints for user profile management
 * - All API routes run on the server only (never on the client)
 * - Now connects to PostgreSQL database using Prisma
 */
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '../../../lib/auth';
import { encryptApiKey, validateOpenAIApiKey } from '../../../lib/encryption';

const prisma = new PrismaClient();

// Helper function to get the authenticated user from session
async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  
  return await prisma.user.findUnique({
    where: { id: session.user.id }
  });
}

/**
 * GET route handler for /api/profile
 * Retrieves the current user's profile data including health goals, dietary preferences, and fitness level
 * 
 * This function is automatically called when a GET request is made to /api/profile
 * 
 * @returns NextResponse containing the user profile data
 */
export async function GET() {
  try {
    // Get the authenticated user from session
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile from database
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: {
        healthGoal: true,
        dietaryPreferences: true,
        fitnessLevel: true,
        hasApiKey: true,
        updatedAt: true
      }
    });

    // If no profile exists, return default values
    if (!userProfile) {
      return NextResponse.json({
        healthGoal: '',
        dietaryPreferences: [],
        fitnessLevel: '',
        hasApiKey: false,
        updatedAt: null
      });
    }

    // Return the profile data
    return NextResponse.json({
      healthGoal: userProfile.healthGoal || '',
      dietaryPreferences: userProfile.dietaryPreferences || [],
      fitnessLevel: userProfile.fitnessLevel || '',
      hasApiKey: userProfile.hasApiKey || false,
      updatedAt: userProfile.updatedAt.toISOString()
    });
    
  } catch (error) {
    console.error('Error in profile GET:', error);
    return NextResponse.json({ message: 'Error fetching profile', error }, { status: 500 });
  }
}

/**
 * PUT Request Handler - Updates user profile data
 * 
 * This function is automatically called when a PUT request is made to /api/profile
 * 
 * @param request - The incoming HTTP request with the profile data
 * @returns NextResponse with the updated profile data or an error
 */
export async function PUT(request: Request) {
  try {
    // Parse the JSON body from the request
    const body = await request.json();
    const { healthGoal, dietaryPreferences, fitnessLevel, apiKey } = body;

    // Basic validation
    if (!Array.isArray(dietaryPreferences)) {
      return NextResponse.json({ message: 'dietaryPreferences must be an array' }, { status: 400 });
    }

    // Validate API key if provided
    if (apiKey && !validateOpenAIApiKey(apiKey)) {
      return NextResponse.json({ message: 'Invalid OpenAI API key format' }, { status: 400 });
    }

    // Get the authenticated user from session
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Prepare update data
    interface UpdateData {
      healthGoal: string | null;
      dietaryPreferences: string[];
      fitnessLevel: string | null;
      updatedAt: Date;
      openaiApiKeyHash?: string;
      hasApiKey?: boolean;
    }

    interface CreateData {
      userId: string;
      healthGoal: string | null;
      dietaryPreferences: string[];
      fitnessLevel: string | null;
      openaiApiKeyHash?: string;
      hasApiKey?: boolean;
    }

    const updateData: UpdateData = {
      healthGoal: healthGoal || null,
      dietaryPreferences: dietaryPreferences,
      fitnessLevel: fitnessLevel || null,
      updatedAt: new Date()
    };

    const createData: CreateData = {
      userId: user.id,
      healthGoal: healthGoal || null,
      dietaryPreferences: dietaryPreferences,
      fitnessLevel: fitnessLevel || null
    };

    // Handle API key encryption if provided
    if (apiKey) {
      try {
        const encryptedApiKey = encryptApiKey(apiKey);
        updateData.openaiApiKeyHash = encryptedApiKey;
        updateData.hasApiKey = true;
        createData.openaiApiKeyHash = encryptedApiKey;
        createData.hasApiKey = true;
      } catch (error) {
        console.error('Error encrypting API key:', error);
        return NextResponse.json({ message: 'Failed to encrypt API key' }, { status: 500 });
      }
    }

    // Upsert the user profile (create if doesn't exist, update if it does)
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: updateData,
      create: createData,
      select: {
        healthGoal: true,
        dietaryPreferences: true,
        fitnessLevel: true,
        hasApiKey: true,
        updatedAt: true
      }
    });

    // Return the updated profile data
    return NextResponse.json({
      healthGoal: updatedProfile.healthGoal || '',
      dietaryPreferences: updatedProfile.dietaryPreferences || [],
      fitnessLevel: updatedProfile.fitnessLevel || '',
      hasApiKey: updatedProfile.hasApiKey || !!apiKey,
      updatedAt: updatedProfile.updatedAt.toISOString(),
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Error in profile PUT:', error);
    return NextResponse.json({ message: 'Error updating profile', error }, { status: 500 });
  }
} 