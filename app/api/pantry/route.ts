/**
 * Pantry API Route Handler - Manages CRUD operations for pantry items
 * 
 * In Next.js App Router:
 * - This file handles requests to /api/pantry
 * - It provides GET, POST, and DELETE endpoints
 * - All API routes run on the server only (never on the client)
 * - Now connects to PostgreSQL database instead of using in-memory data
 */
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '../../../lib/auth';

const prisma = new PrismaClient();

// TypeScript interface to define the shape of pantry items (matching Prisma schema)
interface PantryItemResponse {
  id: string;
  itemName: string;
  category: string;
  notes?: string;
  addedAt: string;
}

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
 * GET Request Handler - Returns all pantry items or statistics based on search params
 * 
 * This function is automatically called when a GET request is made to /api/pantry
 * Next.js routes the request based on the exported function name (GET)
 * 
 * @param request - The incoming HTTP request
 * @returns NextResponse containing the list of pantry items or statistics
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const isStats = url.searchParams.get('stats') === 'true';

    // Get the authenticated user from session
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (isStats) {
      // Return statistics about pantry items from database
      try {
        const items = await prisma.pantryItem.findMany({
          where: { userId: user.id },
          select: {
            category: true
          }
        });

        const stats = {
          totalItems: items.length,
          categoryCounts: {} as Record<string, number>,
        };

        // Count items by category
        items.forEach((item) => {
          const category = item.category;
          if (!stats.categoryCounts[category]) {
            stats.categoryCounts[category] = 0;
          }
          stats.categoryCounts[category]++;
        });

        return NextResponse.json(stats);
      } catch (error) {
        console.error('Error calculating pantry statistics:', error);
        return NextResponse.json(
          { message: 'Error calculating pantry statistics' },
          { status: 500 }
        );
      }
    }

    // Default behavior: return all pantry items from database
    const pantryItems = await prisma.pantryItem.findMany({
      where: { userId: user.id },
      orderBy: { addedAt: 'desc' },
      select: {
        id: true,
        itemName: true,
        category: true,
        notes: true,
        addedAt: true
      }
    });

    // Format response to match expected frontend format
    const formattedItems: PantryItemResponse[] = pantryItems.map(item => ({
      id: item.id,
      itemName: item.itemName,
      category: item.category,
      notes: item.notes || undefined,
      addedAt: item.addedAt.toISOString()
    }));

    return NextResponse.json(formattedItems);
    
  } catch (error) {
    console.error('Error in pantry GET:', error);
    return NextResponse.json({ message: 'Error fetching pantry items' }, { status: 500 });
  }
}

/**
 * POST Request Handler - Adds a new pantry item to the database
 * 
 * This function is automatically called when a POST request is made to /api/pantry
 * 
 * @param request - The incoming HTTP request with the new item data
 * @returns NextResponse with the newly created item or an error
 */
export async function POST(request: Request) {
  try {
    // Extract data from the request body
    const { itemName, category, notes } = await request.json();
    
    // Validate required fields
    if (!itemName || !category) {
      return NextResponse.json({ message: 'Item name and category are required' }, { status: 400 });
    }

    // Get the authenticated user from session
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Create the item in the database
    const newItem = await prisma.pantryItem.create({
      data: {
        itemName,
        category,
        notes: notes || null,
        userId: user.id
      },
      select: {
        id: true,
        itemName: true,
        category: true,
        notes: true,
        addedAt: true
      }
    });

    // Format response to match expected frontend format
    const formattedItem: PantryItemResponse = {
      id: newItem.id,
      itemName: newItem.itemName,
      category: newItem.category,
      notes: newItem.notes || undefined,
      addedAt: newItem.addedAt.toISOString()
    };
    
    // Return the created item with 201 Created status
    return NextResponse.json(formattedItem, { status: 201 });
    
  } catch (error) {
    console.error('Error in pantry POST:', error);
    return NextResponse.json({ message: 'Error adding item' }, { status: 500 });
  }
}

/**
 * PUT Request Handler - Updates a pantry item by ID in the database
 * 
 * This function is automatically called when a PUT request is made to /api/pantry
 * 
 * @param request - The incoming HTTP request with the item data to update
 * @returns NextResponse with the updated item or an error
 */
export async function PUT(request: Request) {
  try {
    // Extract data from the request body
    const { id, itemName, category, notes } = await request.json();
    
    // Validate required fields
    if (!id || !itemName || !category) {
      return NextResponse.json({ message: 'Item ID, name and category are required' }, { status: 400 });
    }

    // Get the authenticated user from session
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Try to update the item in the database
    try {
      const updatedItem = await prisma.pantryItem.update({
        where: { 
          id,
          userId: user.id  // Ensure user can only update their own items
        },
        data: {
          itemName,
          category,
          notes: notes || null
        },
        select: {
          id: true,
          itemName: true,
          category: true,
          notes: true,
          addedAt: true
        }
      });

      // Format response to match expected frontend format
      const formattedItem: PantryItemResponse = {
        id: updatedItem.id,
        itemName: updatedItem.itemName,
        category: updatedItem.category,
        notes: updatedItem.notes || undefined,
        addedAt: updatedItem.addedAt.toISOString()
      };
      
      // Return the updated item
      return NextResponse.json(formattedItem, { status: 200 });
      
    } catch (updateError: unknown) {
      // If the item wasn't found (or doesn't belong to user), return a 404
      if (updateError && typeof updateError === 'object' && 'code' in updateError && updateError.code === 'P2025') {
        return NextResponse.json({ message: 'Item not found' }, { status: 404 });
      }
      throw updateError; // Re-throw other errors
    }
    
  } catch (error) {
    console.error('Error in pantry PUT:', error);
    return NextResponse.json({ message: 'Error updating item' }, { status: 500 });
  }
}

/**
 * DELETE Request Handler - Removes a pantry item by ID from the database
 * 
 * This function is automatically called when a DELETE request is made to /api/pantry
 * 
 * @param request - The incoming HTTP request with the item ID to delete
 * @returns NextResponse with success/error message
 */
export async function DELETE(request: Request) {
  try {
    // Extract the item ID from the request body
    const { id } = await request.json();
    
    // Validate the ID is provided
    if (!id) {
      return NextResponse.json({ message: 'Item ID is required' }, { status: 400 });
    }

    // Get the authenticated user from session
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Try to delete the item from the database
    try {
      await prisma.pantryItem.delete({
        where: { 
          id,
          userId: user.id  // Ensure user can only delete their own items
        }
      });
      
      // Return success message
      return NextResponse.json({ message: 'Item deleted successfully' }, { status: 200 });
      
    } catch (deleteError: unknown) {
      // If the item wasn't found (or doesn't belong to user), return a 404
      if (deleteError && typeof deleteError === 'object' && 'code' in deleteError && deleteError.code === 'P2025') {
        return NextResponse.json({ message: 'Item not found' }, { status: 404 });
      }
      throw deleteError; // Re-throw other errors
    }
    
  } catch (error) {
    console.error('Error in pantry DELETE:', error);
    return NextResponse.json({ message: 'Error deleting item' }, { status: 500 });
  }
}
