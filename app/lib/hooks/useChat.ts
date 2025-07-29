'use client';

import { useState, useCallback } from 'react';

// Types for messages and conversations
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  time: string;
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/chat?type=conversations');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the conversations state, preserving any locally created conversations
      // that don't exist on the server yet (identified by their id format)
      setConversations(prev => {
        // Get server conversation IDs
        const serverIds = data.conversations.map((c: Conversation) => c.id);
        
        // Find local conversations that aren't on the server yet
        const localOnly = prev.filter(c => !serverIds.includes(c.id) && c.id.startsWith('conv_'));
        
        // Combine them with server conversations at the beginning
        return [...localOnly, ...data.conversations];
      });
      
      // Select the first conversation if none is selected
      if (data.conversations.length > 0 && !selectedConversation) {
        setSelectedConversation(data.conversations[0].id);
      }
      
      return data.conversations;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
      console.error('Error fetching conversations:', err);
      return [];
    }
  }, [selectedConversation]); // Keep selectedConversation dependency for proper selection

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setError(null);
    setMessages([]); // Clear current messages when switching conversations
    
    try {
      const response = await fetch(`/api/chat?type=messages&conversationId=${conversationId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const data = await response.json();
      setMessages(data.messages);
      return data.messages;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      console.error('Error fetching messages:', err);
      return [];
    }
  }, []);

  // Send a new message
  const sendMessage = useCallback(async (content: string) => {
    if (!selectedConversation) {
      setError('No conversation selected');
      return;
    }
    
    setError(null);
    
    // Create and add the user message immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Determine if this is a temporary conversation (starts with 'conv_')
      const isTemporaryConversation = selectedConversation.startsWith('conv_');
      
      // Send the message to the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: content, 
          // Don't send conversationId for temporary conversations
          conversationId: isTemporaryConversation ? null : selectedConversation 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      const aiResponse = await response.json();
      
      // Add the AI response to the messages
      setMessages(prev => [...prev, aiResponse]);
      
      // If this was a temporary conversation, update it with the real conversationId
      if (isTemporaryConversation && aiResponse.conversationId) {
        const tempConversationId = selectedConversation;
        
        // Update the conversation list - replace temporary conversation with real one
        setConversations(prev => 
          prev.map(conv => 
            conv.id === tempConversationId
              ? { 
                  ...conv,
                  id: aiResponse.conversationId,
                  title: content.length > 30 ? content.substring(0, 30) + '...' : content,
                  lastMessage: content, 
                  time: 'Just now' 
                }
              : conv
          )
        );
        
        // Update the selected conversation ID
        setSelectedConversation(aiResponse.conversationId);
      } else {
        // Update existing conversation with the new message
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation
              ? { 
                  ...conv, 
                  lastMessage: content, 
                  time: 'Just now' 
                }
              : conv
          )
        );
      }
      
      return aiResponse;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedConversation]);

  // Create a new conversation
  const createNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'New Conversation',
      lastMessage: 'Start a new conversation',
      time: 'Just now',
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setSelectedConversation(newConversation.id);
    setMessages([]);
    
    return newConversation;
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    setError(null);
    
    try {
      // Only call API for server-side conversations (not local temp ones)
      if (!conversationId.startsWith('conv_')) {
        const response = await fetch(`/api/chat?conversationId=${conversationId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete conversation: ${response.status}`);
        }
      }
      
      // Remove the conversation from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // If the deleted conversation was selected, clear selection and messages
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
        
        // Optionally select the first remaining conversation
        setConversations(prev => {
          if (prev.length > 0) {
            setSelectedConversation(prev[0].id);
          }
          return prev;
        });
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
      console.error('Error deleting conversation:', err);
      return false;
    }
  }, [selectedConversation]);

  return {
    conversations,
    selectedConversation,
    messages,
    isLoading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createNewConversation,
    deleteConversation,
    setSelectedConversation,
  };
} 