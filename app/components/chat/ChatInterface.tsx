'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiUser, FiMessageSquare } from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';

// TypeScript interface for message structure
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  selectedConversationId?: string | null;
}

const ChatInterface = ({ 
  messages, 
  onSendMessage, 
  isLoading = false,
  selectedConversationId 
}: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-6 border-b border-green-100">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-800 rounded-full flex items-center justify-center">
            <FiMessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Hygieia</h2>
            <p className="text-green-700 text-sm">Your personal health & fitness assistant</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
        {messages.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center text-gray-500">
              <FiMessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start a conversation by typing a message below</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex w-full",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "flex w-full max-w-4xl",
                message.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === 'user' ? "bg-green-700 ml-3" : "bg-gray-200 mr-3"
                )}>
                  {message.role === 'user' ? (
                    <FiUser className="w-5 h-5 text-white" />
                  ) : (
                    <FiMessageSquare className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className={cn(
                  "rounded-2xl px-4 py-3 shadow-sm flex-1 min-w-0",
                  message.role === 'user' ? "bg-green-700 text-white" : "bg-gray-50 text-gray-800"
                )}>
                  {message.role === 'assistant' ? (
                    <div className="w-full overflow-hidden">
                      <ReactMarkdown
                        components={{
                          h3: ({ children }) => (
                            <h3 className="text-lg font-bold text-gray-800 mt-4 mb-2 first:mt-0">
                              {children}
                            </h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-base font-semibold text-gray-800 mt-3 mb-2">
                              {children}
                            </h4>
                          ),
                          p: ({ children }) => (
                            <p className="text-gray-700 mb-2 leading-relaxed break-words">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-3 space-y-1">
                              {children}
                            </ul>
                          ),
                          li: ({ children }) => (
                            <li className="text-gray-700 ml-2 break-words">
                              {children}
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-800">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-gray-700">
                              {children}
                            </em>
                          )
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>
                  )}
                  <p className={cn(
                    "text-xs mt-2",
                    message.role === 'user' ? "text-green-100" : "text-gray-500"
                  )}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-2xl">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                <FiMessageSquare className="w-5 h-5 text-gray-600" />
              </div>
              <div className="bg-gray-50 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-green-700 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-700 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-700 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <div className="p-6 border-t border-green-100">
        <div className="bg-green-50 rounded-2xl p-4">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedConversationId 
                ? "Ask me about meals, workouts, or nutrition..." 
                : "Select a conversation to start chatting..."
              }
              className="flex-1 px-4 py-3 bg-white border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
              disabled={isLoading || !selectedConversationId}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading || !selectedConversationId}
              className="bg-green-700 text-white px-6 py-3 rounded-xl hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <FiSend className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 