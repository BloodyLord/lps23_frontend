'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        router.push('/login');
        return;
      }

      try {
        // Optional: Verify token with your FastAPI backend
        const response = await fetch('http://localhost:8000/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Token is invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        // If verification fails, still allow access if token exists
        // You might want to handle this differently based on your needs
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, [router]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect handled above)
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated, render the protected content
  return <>{children}</>;
}