"use client";

import Link from 'next/link';
import { UserIcon } from './Icons';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '../lib/utils';

// Navbar component for application navigation
export default function Navbar() {
  // Always call all hooks first - never call hooks conditionally
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chatHovered, setChatHovered] = useState(false);
  const [pantryHovered, setPantryHovered] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  // Conditional rendering logic - AFTER all hooks have been called
  // Don't render navbar on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <nav className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="font-bold text-xl text-zinc-900 flex items-center">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <span className="text-green-700">🥦</span>
            </div>
            Hygieia
          </div>
          <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
        </div>
      </nav>
    );
  }

  // Don't render navbar if not authenticated (middleware will redirect)
  if (!session) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo/Brand */}
        <Link href="/" className="font-bold text-xl text-zinc-900 flex items-center">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
            <span className="text-green-700">🥦</span>
          </div>
          Hygieia
        </Link>
        
        {/* User Menu and Navigation - Desktop */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Navigation Links */}
          <Link 
            href="/chat" 
            className={`font-bold text-lg ${pathname === '/chat' ? 'text-green-700' : chatHovered ? 'text-green-700' : 'text-zinc-900'}`}
            onMouseEnter={() => setChatHovered(true)}
            onMouseLeave={() => setChatHovered(false)}
            style={{ transition: 'color 0.2s ease-in-out' }}
          >
            Chat
          </Link>
          <Link 
            href="/pantry" 
            className={`font-bold text-lg ${pathname === '/pantry' ? 'text-green-700' : pantryHovered ? 'text-green-700' : 'text-zinc-900'}`}
            onMouseEnter={() => setPantryHovered(true)}
            onMouseLeave={() => setPantryHovered(false)}
            style={{ transition: 'color 0.2s ease-in-out' }}
          >
            Pantry
          </Link>
          
          {/* User Avatar with Dropdown Menu */}
          <div ref={dropdownRef} className="relative">
            <button 
              className={cn(
                "w-10 h-10 rounded-full bg-green-100 flex items-center justify-center",
                "transition-colors border border-neutral-200 cursor-pointer shadow-md",
                "hover:bg-green-200 hover:border-green-700 hover:shadow-lg"
              )}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <UserIcon className="w-5 h-5 text-green-700" />
            </button>
            
            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div 
                className={cn(
                  "absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-md",
                  "border border-neutral-200 py-2 z-50"
                )}
              >
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-zinc-700 hover:bg-green-50 hover:text-green-700"
                >
                  Profile Settings
                </Link>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-green-50 hover:text-green-700 cursor-pointer"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
          
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-zinc-700"
          onClick={toggleMobileMenu}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200 py-4 px-4 mt-4">
          <div className="flex flex-col space-y-4">
            <Link 
              href="/" 
              className="font-bold text-lg text-zinc-900 py-2 active:text-green-700"
              onClick={() => setMobileMenuOpen(false)}
              onMouseOver={(e) => e.currentTarget.style.color = '#15803d'} 
              onMouseOut={(e) => e.currentTarget.style.color = pathname === '/' ? '#15803d' : '#18181b'}
            >
              Chat
            </Link>
            <Link 
              href="/pantry" 
              className="font-bold text-lg text-zinc-900 py-2 active:text-green-700"
              onClick={() => setMobileMenuOpen(false)}
              onMouseOver={(e) => e.currentTarget.style.color = '#15803d'} 
              onMouseOut={(e) => e.currentTarget.style.color = pathname === '/pantry' ? '#15803d' : '#18181b'}
            >
              Pantry
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
} 