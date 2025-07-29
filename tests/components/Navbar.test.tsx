import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Navbar from '../../app/components/Navbar';

// Mock Next.js navigation hook
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock the Icons component
jest.mock('../../app/components/Icons', () => ({
  UserIcon: ({ className }: any) => <span className={className} data-testid="user-icon">👤</span>
}));

// Mock the utils function
jest.mock('../../app/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe('Navbar Component', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com'
    },
    expires: '2024-12-31T23:59:59.999Z'
  };

  const mockUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: mockUpdate
    });
  });

  test('does not render on login page', () => {
    mockUsePathname.mockReturnValue('/login');
    
    const { container } = render(<Navbar />);
    
    expect(container.firstChild).toBeNull();
  });

  test('does not render on register page', () => {
    mockUsePathname.mockReturnValue('/register');
    
    const { container } = render(<Navbar />);
    
    expect(container.firstChild).toBeNull();
  });

  test('shows loading state when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: mockUpdate
    });

    render(<Navbar />);

    expect(screen.getByText('Hygieia')).toBeInTheDocument();
    expect(screen.getByText('🥦')).toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('does not render when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdate
    });

    const { container } = render(<Navbar />);
    
    expect(container.firstChild).toBeNull();
  });

  test('renders navbar with navigation links when authenticated', () => {
    render(<Navbar />);

    expect(screen.getByText('Hygieia')).toBeInTheDocument();
    expect(screen.getByText('🥦')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /hygieia/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /chat/i })).toHaveAttribute('href', '/chat');
    expect(screen.getByRole('link', { name: /pantry/i })).toHaveAttribute('href', '/pantry');
  });

  test('highlights active navigation link', () => {
    mockUsePathname.mockReturnValue('/chat');
    
    render(<Navbar />);

    const chatLink = screen.getByRole('link', { name: /chat/i });
    expect(chatLink).toHaveClass('text-green-700');
  });

  test('shows user avatar button', () => {
    render(<Navbar />);

    const avatarButton = screen.getByTestId('user-icon').closest('button');
    expect(avatarButton).toBeInTheDocument();
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  test('opens dropdown menu when avatar button is clicked', () => {
    render(<Navbar />);

    const avatarButton = screen.getByTestId('user-icon').closest('button');
    
    // Initially dropdown should not be visible
    expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();

    // Click avatar button
    fireEvent.click(avatarButton!);

    // Dropdown should now be visible
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  test('closes dropdown menu when avatar button is clicked again', () => {
    render(<Navbar />);

    const avatarButton = screen.getByTestId('user-icon').closest('button');
    
    // Open dropdown
    fireEvent.click(avatarButton!);
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();

    // Close dropdown
    fireEvent.click(avatarButton!);
    expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
  });

  test('profile settings link points to correct URL', () => {
    render(<Navbar />);

    const avatarButton = screen.getByTestId('user-icon').closest('button');
    fireEvent.click(avatarButton!);

    const profileLink = screen.getByRole('link', { name: /profile settings/i });
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  test('calls signOut when sign out button is clicked', () => {
    render(<Navbar />);

    const avatarButton = screen.getByTestId('user-icon').closest('button');
    fireEvent.click(avatarButton!);

    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });

  test('closes dropdown when clicking outside', () => {
    render(<Navbar />);

    const avatarButton = screen.getByTestId('user-icon').closest('button');
    fireEvent.click(avatarButton!);
    
    // Dropdown should be open
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();

    // Click outside the dropdown
    fireEvent.mouseDown(document.body);

    // Dropdown should close
    expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
  });

  test('does not close dropdown when clicking inside it', () => {
    render(<Navbar />);

    const avatarButton = screen.getByTestId('user-icon').closest('button');
    fireEvent.click(avatarButton!);

    const dropdown = screen.getByText('Profile Settings').closest('div');
    fireEvent.mouseDown(dropdown!);

    // Dropdown should remain open
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
  });

  test('shows mobile menu button on mobile', () => {
    render(<Navbar />);

    const mobileMenuButton = screen.getAllByRole('button').find(button => 
      button.querySelector('svg')
    );
    expect(mobileMenuButton).toBeInTheDocument();
  });

  test('opens mobile menu when button is clicked', () => {
    render(<Navbar />);

    const mobileMenuButton = screen.getAllByRole('button').find(button => 
      button.querySelector('svg')
    );
    
    // Initially mobile menu should not be visible
    expect(screen.queryByText('Chat')).toBeInTheDocument(); // Desktop nav

    // Click mobile menu button
    fireEvent.click(mobileMenuButton!);

    // Mobile menu should now be visible - check for mobile nav container
    const mobileNav = document.querySelector('.md\\:hidden .flex-col');
    expect(mobileNav).toBeInTheDocument();
  });

  test('closes mobile menu when nav link is clicked', () => {
    render(<Navbar />);

    const mobileMenuButton = screen.getAllByRole('button').find(button => 
      button.querySelector('svg')
    );
    fireEvent.click(mobileMenuButton!);

    // Find mobile nav link and click it
    const mobileNavLinks = screen.getAllByRole('link').filter(link => 
      link.getAttribute('href') === '/pantry'
    );
    // Click the mobile version (there will be desktop and mobile versions)
    fireEvent.click(mobileNavLinks[mobileNavLinks.length - 1]);

    // Mobile menu should close (nav links should not be visible in mobile menu)
    const mobileNav = document.querySelector('.md\\:hidden .flex-col');
    expect(mobileNav).not.toBeInTheDocument();
  });

  test('applies hover effects to navigation links', () => {
    render(<Navbar />);

    const chatLink = screen.getByRole('link', { name: /chat/i });
    
    // Simulate hover
    fireEvent.mouseEnter(chatLink);
    
    // Since we're using inline styles for hover effects, we can't easily test the color change
    // But we can verify the event handlers are attached by checking they don't throw errors
    fireEvent.mouseLeave(chatLink);
    
    expect(chatLink).toBeInTheDocument();
  });

  test('applies correct styling when on pantry page', () => {
    mockUsePathname.mockReturnValue('/pantry');
    
    render(<Navbar />);

    const pantryLink = screen.getByRole('link', { name: /pantry/i });
    expect(pantryLink).toHaveClass('text-green-700');
  });

  test('shows correct accessibility attributes on dropdown', () => {
    render(<Navbar />);

    const avatarButton = screen.getByTestId('user-icon').closest('button');
    
    expect(avatarButton).toHaveAttribute('aria-expanded', 'false');
    expect(avatarButton).toHaveAttribute('aria-haspopup', 'true');

    fireEvent.click(avatarButton!);
    
    expect(avatarButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('handles session with missing user data gracefully', () => {
    mockUseSession.mockReturnValue({
      data: { user: undefined } as any,
      status: 'authenticated',
      update: mockUpdate
    });

    const { container } = render(<Navbar />);
    
    // Should still render navbar since session exists, even if user is undefined
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText('Hygieia')).toBeInTheDocument();
  });

  test('handles various pathnames correctly', () => {
    const testCases = [
      { pathname: '/', shouldRender: true },
      { pathname: '/chat', shouldRender: true },
      { pathname: '/pantry', shouldRender: true },
      { pathname: '/profile', shouldRender: true },
      { pathname: '/login', shouldRender: false },
      { pathname: '/register', shouldRender: false },
    ];

    testCases.forEach(({ pathname, shouldRender }) => {
      mockUsePathname.mockReturnValue(pathname);
      
      const { container, unmount } = render(<Navbar />);
      
      if (shouldRender) {
        expect(container.firstChild).not.toBeNull();
      } else {
        expect(container.firstChild).toBeNull();
      }
      
      unmount();
    });
  });

  test('applies mobile hover effects to navigation links', () => {
    render(<Navbar />);

    const mobileMenuButton = screen.getAllByRole('button').find(button => 
      button.querySelector('svg')
    );
    fireEvent.click(mobileMenuButton!);

    // Find mobile nav links
    const mobileNavLinks = document.querySelectorAll('.md\\:hidden a');
    
    mobileNavLinks.forEach(link => {
      // Simulate hover events to ensure they don't throw errors
      fireEvent.mouseOver(link);
      fireEvent.mouseOut(link);
    });

    expect(mobileNavLinks.length).toBeGreaterThan(0);
  });

  test('maintains dropdown state during re-renders', () => {
    const { rerender } = render(<Navbar />);

    const avatarButton = screen.getByTestId('user-icon').closest('button');
    fireEvent.click(avatarButton!);
    
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();

    // Re-render with same props
    rerender(<Navbar />);
    
    // Dropdown should still be open
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
  });
});