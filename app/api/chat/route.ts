/**
 * Chat API Route Handler - Handles API requests to /api/chat
 * 
 * In Next.js App Router:
 * - API routes are defined in the app/api directory
 * - route.ts (or route.js) files define API endpoints
 * - They export HTTP methods like GET, POST, PUT, DELETE, etc.
 * - They run on the server and never on the client
 */
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '../../../lib/auth';
import OpenAI from 'openai';
import { decryptApiKey } from '../../../lib/encryption';

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

// Helper function to get user's OpenAI client instance
async function getUserOpenAIClient(userId: string): Promise<OpenAI | null> {
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { openaiApiKeyHash: true, hasApiKey: true }
    });

    if (!userProfile?.hasApiKey || !userProfile.openaiApiKeyHash) {
      return null;
    }

    const decryptedApiKey = decryptApiKey(userProfile.openaiApiKeyHash);
    return new OpenAI({ apiKey: decryptedApiKey });
  } catch (error) {
    console.error('Error creating OpenAI client:', error);
    return null;
  }
}

// Types for user context
interface UserProfile {
  healthGoal: string | null;
  dietaryPreferences: string[];
  fitnessLevel: string | null;
}

interface PantryItem {
  itemName: string;
  category: string;
  notes: string | null;
}

interface UserContext {
  profile: UserProfile | null;
  pantryItems: PantryItem[];
}

// Helper function to get user context for AI prompts
async function getUserContext(userId: string): Promise<UserContext> {
  try {
    const [userProfile, pantryItems] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId },
        select: {
          healthGoal: true,
          dietaryPreferences: true,
          fitnessLevel: true
        }
      }),
      prisma.pantryItem.findMany({
        where: { userId },
        select: {
          itemName: true,
          category: true,
          notes: true
        },
        orderBy: { category: 'asc' }
      })
    ]);

    return {
      profile: userProfile,
      pantryItems
    };
  } catch (error) {
    console.error('Error fetching user context:', error);
    return {
      profile: null,
      pantryItems: []
    };
  }
}

// Helper function to create the system prompt with user context
function createSystemPrompt(userContext: UserContext): string {
  const { profile, pantryItems } = userContext;
  
  let systemPrompt = `You are an AI personal trainer and nutritionist assistant. Your role is to provide personalized health, fitness, and nutrition advice based on the user's profile and available ingredients.

**IMPORTANT DISCLAIMERS:**
- You are an AI assistant providing general guidance only
- Your advice should not replace professional medical advice
- Users should consult healthcare professionals for serious health concerns
- Always recommend users speak with doctors before starting new exercise or diet programs

**USER PROFILE:**`;

  if (profile?.healthGoal) {
    systemPrompt += `\n- Health Goal: ${profile.healthGoal}`;
  }

  if (profile?.fitnessLevel) {
    systemPrompt += `\n- Fitness Level: ${profile.fitnessLevel}`;
  }

  if (profile?.dietaryPreferences && profile.dietaryPreferences.length > 0) {
    systemPrompt += `\n- Dietary Preferences: ${profile.dietaryPreferences.join(', ')}`;
  }

  if (pantryItems && pantryItems.length > 0) {
    systemPrompt += `\n\n**AVAILABLE PANTRY ITEMS:**`;
    
    // Group pantry items by category
    const groupedItems = pantryItems.reduce((acc: Record<string, PantryItem[]>, item: PantryItem) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});

    Object.entries(groupedItems).forEach(([category, items]: [string, PantryItem[]]) => {
      systemPrompt += `\n\n${category}:`;
      items.forEach((item: PantryItem) => {
        systemPrompt += `\n- ${item.itemName}`;
        if (item.notes) {
          systemPrompt += ` (${item.notes})`;
        }
      });
    });
  } else {
    systemPrompt += `\n\n**PANTRY ITEMS:** No items currently listed`;
  }

  systemPrompt += `\n\n**INSTRUCTIONS:**
1. Provide personalized recommendations based on the user's profile and available ingredients
2. For recipe requests, prioritize using ingredients from their pantry
3. For workout requests, consider their health goals and fitness level
4. Be encouraging and motivational in your responses
5. Keep responses practical and actionable
6. If pantry items are limited, suggest simple additions they could make
7. Always consider dietary preferences when making recommendations
8. Include approximate nutritional information when relevant
9. Suggest modifications for different fitness levels when providing workout advice

Respond in a helpful, encouraging, and professional tone. Focus on practical advice they can implement immediately.`;

  return systemPrompt;
}

// GET endpoint to retrieve conversations or messages
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    
    // Get the authenticated user from session
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    if (type === 'conversations') {
      // Fetch conversations from database
      const conversations = await prisma.conversation.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          lastMessage: true,
          updatedAt: true
        }
      });

      // Format response to match expected frontend format
      const formattedConversations = conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        lastMessage: conv.lastMessage || '',
        time: formatTimeAgo(conv.updatedAt)
      }));

      return NextResponse.json({ conversations: formattedConversations });
      
    } else if (type === 'messages') {
      const conversationId = url.searchParams.get('conversationId');
      
      if (conversationId) {
        // Fetch messages for specific conversation from database
        const messages = await prisma.conversationMessage.findMany({
          where: { 
            conversationId,
            userId: user.id 
          },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
            userId: true
          }
        });

        // Format messages to match expected frontend format
        const formattedMessages = messages.map(msg => ({
          id: msg.id,
          userId: msg.userId,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          createdAt: msg.createdAt.toISOString()
        }));

        return NextResponse.json({ messages: formattedMessages });
      }
      
      // If conversation doesn't exist or no ID provided, return empty array
      return NextResponse.json({ messages: [] });
    }
    
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in chat GET:', error);
    return NextResponse.json({ message: 'Error fetching data', error }, { status: 500 });
  }
}

/**
 * POST Request Handler - Processes chat messages and saves them to database
 * 
 * - Receives a message in the request body
 * - Saves the user message to the database
 * - Generates an AI response and saves it too
 * - Returns the AI response
 * 
 * @param request - The incoming HTTP request object
 * @returns NextResponse with JSON data
 */
export async function POST(request: Request) {
  try {
    // Parse the JSON body from the request
    const body = await request.json();
    const { message, conversationId } = body;

    // Validate the request data
    if (!message) {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 });
    }

    // Get the authenticated user from session
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let currentConversationId = conversationId;

    // If conversation ID provided and it's not null, verify it exists
    if (currentConversationId && currentConversationId.trim() !== '') {
      const existingConversation = await prisma.conversation.findUnique({
        where: { 
          id: currentConversationId,
          userId: user.id // Ensure user owns this conversation
        }
      });
      
      if (!existingConversation) {
        console.log(`Conversation ${currentConversationId} not found for user ${user.id}, creating new conversation`);
        currentConversationId = null; // Force creation of new conversation
      }
    } else {
      // No conversation ID provided (new conversation)
      currentConversationId = null;
    }

    // If no conversation ID provided or invalid ID, create a new conversation
    if (!currentConversationId) {
      try {
        const newConversation = await prisma.conversation.create({
          data: {
            title: generateConversationTitle(message),
            lastMessage: message,
            userId: user.id
          }
        });
        currentConversationId = newConversation.id;
      } catch (conversationError) {
        console.error('Error creating new conversation:', conversationError);
        throw conversationError;
      }
    }

    // Save the user's message to the database
    await prisma.conversationMessage.create({
      data: {
        role: 'user',
        content: message,
        userId: user.id,
        conversationId: currentConversationId
      }
    });

    // Get user's OpenAI client instance
    const openaiClient = await getUserOpenAIClient(user.id);
    
    if (!openaiClient) {
      return NextResponse.json({ 
        message: 'OpenAI API key not configured. Please add your API key in your profile settings.' 
      }, { status: 400 });
    }

    // Get user context for personalized responses
    const userContext = await getUserContext(user.id);

    // Get recent conversation history for context
    const recentMessages = await prisma.conversationMessage.findMany({
      where: { 
        conversationId: currentConversationId,
        userId: user.id 
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 messages for context
      select: {
        role: true,
        content: true
      }
    });

    // Generate AI response using OpenAI
    const responseContent = await generateAIResponse(
      openaiClient, 
      message, 
      userContext, 
      recentMessages.reverse() // Reverse to get chronological order
    );

    if (!responseContent) {
      return NextResponse.json({ 
        message: 'Failed to generate AI response. Please try again.' 
      }, { status: 500 });
    }

    // Save the AI response to the database
    const aiMessage = await prisma.conversationMessage.create({
      data: {
        role: 'assistant',
        content: responseContent,
        userId: user.id,
        conversationId: currentConversationId
      }
    });

    // Update the conversation's last message
    await prisma.conversation.update({
      where: { id: currentConversationId },
      data: { 
        lastMessage: responseContent,
        updatedAt: new Date()
      }
    });

    // Return the AI response
    return NextResponse.json({
      id: aiMessage.id,
      role: 'assistant',
      content: responseContent,
      createdAt: aiMessage.createdAt.toISOString(),
      conversationId: currentConversationId
    });
    
  } catch (error) {
    console.error('Error in chat POST:', error);
    return NextResponse.json({ message: 'Error processing chat', error }, { status: 500 });
  }
}

// Helper function to format time ago (simple implementation)
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Helper function to generate conversation title from first message
function generateConversationTitle(message: string): string {
  // Simple title generation - take first few words
  const words = message.trim().split(' ').slice(0, 4).join(' ');
  const title = words.length > 30 ? words.substring(0, 30) + '...' : words;
  // Ensure we always return a non-empty title
  return title.trim() || 'New Conversation';
}

// Helper function to generate AI responses using OpenAI
async function generateAIResponse(
  openaiClient: OpenAI, 
  userMessage: string, 
  userContext: UserContext, 
  recentMessages: Array<{role: string, content: string}>
): Promise<string | null> {
  try {
    // Create the system prompt with user context
    const systemPrompt = createSystemPrompt(userContext);

    // Build the conversation history for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add recent conversation history
    recentMessages.forEach(msg => {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      });
    });

    // Add the current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    // Call OpenAI API
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 2000,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      console.error('No response content from OpenAI');
      return null;
    }

    return response.trim();

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    
    // Return a fallback response if OpenAI fails
    if (userMessage.toLowerCase().includes('recipe') || userMessage.toLowerCase().includes('meal')) {
      return "I'm having trouble connecting to generate a personalized recipe right now. Please try again in a moment, or check that your OpenAI API key is valid.";
    } else if (userMessage.toLowerCase().includes('workout') || userMessage.toLowerCase().includes('exercise')) {
      return "I'm having trouble connecting to generate a personalized workout right now. Please try again in a moment, or check that your OpenAI API key is valid.";
    } else {
      return "I'm having trouble processing your request right now. Please try again in a moment, or check that your OpenAI API key is configured correctly in your profile.";
    }
  }
}

/**
 * DELETE Request Handler - Deletes a conversation and all its messages
 * 
 * @param request - The incoming HTTP request object
 * @returns NextResponse with success/error status
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    // Validate the request data
    if (!conversationId) {
      return NextResponse.json({ message: 'Conversation ID is required' }, { status: 400 });
    }

    // Get the authenticated user from session
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify the conversation exists and belongs to the user
    const existingConversation = await prisma.conversation.findUnique({
      where: { 
        id: conversationId,
        userId: user.id // Ensure user owns this conversation
      }
    });

    if (!existingConversation) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }

    // Delete all messages associated with the conversation first
    await prisma.conversationMessage.deleteMany({
      where: { 
        conversationId: conversationId,
        userId: user.id 
      }
    });

    // Delete the conversation
    await prisma.conversation.delete({
      where: { 
        id: conversationId,
        userId: user.id 
      }
    });

    return NextResponse.json({ 
      message: 'Conversation deleted successfully',
      deletedConversationId: conversationId 
    });
    
  } catch (error) {
    console.error('Error in chat DELETE:', error);
    return NextResponse.json({ message: 'Error deleting conversation', error }, { status: 500 });
  }
}
