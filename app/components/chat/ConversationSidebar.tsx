'use client';

import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiMessageCircle, FiChevronDown } from 'react-icons/fi';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

// TypeScript interface for conversation structure
interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  time: string;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  selectedConversationId?: string;
}

const ConversationSidebar = ({
  conversations,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  selectedConversationId,
}: ConversationSidebarProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-lg h-full flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-green-100">
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-gray-800 ${expanded ? 'block' : 'hidden'}`}>
            Conversations
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700 p-1"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <FiChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : 'rotate-0'}`} />
          </Button>
        </div>
        
        {expanded && (
          <div className="flex space-x-2 mt-3">
            <Button 
              onClick={onNewConversation}
              className="flex-1 flex items-center justify-center space-x-2"
              size="sm"
            >
              <FiPlus className="w-4 h-4" />
              <span>New</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="px-3"
              onClick={() => selectedConversationId && onDeleteConversation(selectedConversationId)}
              disabled={!selectedConversationId}
              aria-label="Delete selected conversation"
            >
              <FiTrash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="space-y-3">
          {conversations.map((conv) => (
            <div 
              key={conv.id} 
              className={cn(
                "border border-green-200 rounded-lg p-3 hover:border-green-300 cursor-pointer transition-all hover:shadow-md",
                selectedConversationId === conv.id ? "bg-green-100 border-green-300" : "bg-green-50"
              )}
              onClick={() => onSelectConversation(conv.id)}
            >
              {expanded ? (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-700 rounded-full"></div>
                    <h4 className="text-sm font-medium text-gray-800 truncate flex-1">{conv.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600 truncate mb-1">{conv.lastMessage}</p>
                  <p className="text-xs text-gray-500">{conv.time}</p>
                </div>
              ) : (
                <div className="flex justify-center">
                  <FiMessageCircle className="w-5 h-5 text-green-700" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConversationSidebar; 