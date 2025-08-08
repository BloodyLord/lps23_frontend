'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
// import LoadingScreen from './components/LoadingScreen';
import DevConsole from './components/DevConsole';
import PredictForm from "./components/predictform";
import NetCDFUploader from "./components/netcdf_uploader";

export default function Home() {
  const [isChecking, setIsChecking] = useState(true);
  const [isOffline, setIsOffline] = useState(false); // State for offline mode
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login'); // Redirect to login if no token
      } else {
        setIsChecking(false); // Authentication check passed
      }
    };

    checkAuth();
  }, [router]);

  // Handler for changing the offline mode state
  const handleOfflineModeChange = (status: boolean) => {
    setIsOffline(status);
    // You might want to persist this setting, e.g., in localStorage
    // localStorage.setItem('isOfflineMode', JSON.stringify(status));
  };

  // Show a loading screen while checking authentication status
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render the main dashboard content if authenticated
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Main content area with a dashed border for visual separation */}
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-auto min-h-96 flex flex-col items-center justify-center p-6">
              <div className="text-center w-full">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to Landslide Prediction Dashboard
                </h2>
                <p className="text-gray-600 mb-4">
                  Your components will be displayed here
                </p>
                {/* Grid layout for prediction form and NetCDF uploader */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 w-full">
                  <PredictForm />
                  <NetCDFUploader />
                </div>
                {/* Additional components like loading screen and dev console */}
                <div className="mt-6 w-full">
                  {/* <LoadingScreen /> */}
                  {/* Pass the required props to DevConsole */}
                  <DevConsole
                    isOffline={isOffline}
                    onOfflineModeChange={handleOfflineModeChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
