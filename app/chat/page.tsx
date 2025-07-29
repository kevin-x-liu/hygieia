'use client';

import React, { useEffect, useRef } from 'react';
import ConversationSidebar from '../components/chat/ConversationSidebar';
import ChatInterface from '../components/chat/ChatInterface';
import { useChat } from '../lib/hooks/useChat';

export default function ChatPage() {
  const initialRenderRef = useRef(true);
  const {
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
  } = useChat();

  // Fetch conversations only on initial load
  useEffect(() => {
    if (initialRenderRef.current) {
      fetchConversations();
      initialRenderRef.current = false;
    }
  }, [fetchConversations]);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, fetchMessages]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3 min-h-0">
            <ConversationSidebar
              conversations={conversations}
              selectedConversationId={selectedConversation || undefined}
              onSelectConversation={setSelectedConversation}
              onNewConversation={createNewConversation}
              onDeleteConversation={deleteConversation}
            />
          </div>
          
          {/* Main Chat Area */}
          <div className="col-span-12 md:col-span-9 min-h-0">
            <div className="bg-white rounded-xl shadow-lg h-full">
              <ChatInterface
                messages={messages}
                onSendMessage={sendMessage}
                isLoading={isLoading}
                selectedConversationId={selectedConversation}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
