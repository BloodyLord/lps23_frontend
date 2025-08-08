'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '../components/LoadingScreen';
import DevConsole from '../components/DevConsole';
import PredictForm from "../components/predictform"
import NetCDFUploader from "../components/netcdf_uploader";
import SachetUploadPanel from '../components/SachetUploadPanel';
import CoordinatesDisplay from '../components/CoordinatesDisplay';
import { Feature, Polygon, MultiPolygon } from 'geojson';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('../components/MapComponent'), {
  ssr: false,
  loading: () => null, // We'll handle loading with our custom component
});

const REGION_COMMANDS = {
  northern: { command: 'NORTHERN COMMAND', subtitle: 'Jammu & Kashmir, Himachal Pradesh' },
  central: { command: 'CENTRAL COMMAND', subtitle: 'Uttarakhand, Uttar Pradesh' },
  eastern: { command: 'EASTERN COMMAND', subtitle: 'West Bengal, North East States' },
};

export default function Home() {
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'street' | 'tiff' | 'sachet'>('satellite');
  const [sachetGeoJSONData, setSachetGeoJSONData] = useState<Feature<Polygon | MultiPolygon>[]>([]);
  const [hoverCoordinates, setHoverCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(8);
  const [isRegionTransitioning, setIsRegionTransitioning] = useState(false);
  const [user, setUser] = useState<{id: number; email: string; name: string} | null>(null);
  const [expandedRegions, setExpandedRegions] = useState<{[key: string]: boolean}>({});
  const [isMilitaryCommandsExpanded, setIsMilitaryCommandsExpanded] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const toggleRegionExpansion = (regionId: string) => {
    setExpandedRegions(prev => ({
      ...prev,
      [regionId]: !prev[regionId]
    }));
  };

  const toggleMilitaryCommands = () => {
    setIsMilitaryCommandsExpanded(prev => !prev);
  };

  const openImageModal = () => {
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const currentCommand = selectedRegion 
    ? REGION_COMMANDS[selectedRegion as keyof typeof REGION_COMMANDS]
    : { command: 'WESTERN COMMAND', subtitle: 'Regional Landslide Analysis' };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Loading Screen */}
      {/* {isLoading && (
        <LoadingScreen 
          message="Initializing LAPS System..."
          showProgress={true}
          progress={75}
        />
      )} */}

      {/* Left Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Military Commands Section - Collapsible */}
          <div className="p-6">
            {/* Military Commands Header */}
            <button
              onClick={toggleMilitaryCommands}
              className="w-full flex items-center justify-between p-3 border border-gray-600 rounded-lg hover:border-gray-500 hover:bg-gray-700/30 transition-all duration-200"
            >
              <h2 className="text-lg font-semibold text-green-400">MILITARY COMMANDS</h2>
              <svg 
                className={`w-5 h-5 text-green-400 transform transition-transform duration-200 ${
                  isMilitaryCommandsExpanded ? 'rotate-180' : ''
                }`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Collapsible Regions Content */}
            <div className={`overflow-hidden transition-all duration-300 ${
              isMilitaryCommandsExpanded ? 'max-h-96' : 'max-h-0'
            }`}>
              <div className="mt-4 space-y-3">
                <RegionButton
                  id="northern"
                  title="Northern Region"
                  subtitle="jammu & kashmir, himachal pradesh"
                  isSelected={selectedRegion === 'northern'}
                  onClick={() => {
                    if (!isRegionTransitioning) {
                      setIsRegionTransitioning(true);
                      setSelectedRegion(selectedRegion === 'northern' ? null : 'northern');
                      setTimeout(() => setIsRegionTransitioning(false), 1600);
                    }
                  }}
                  disabled={isRegionTransitioning}
                />
                
                <RegionButton
                  id="central"
                  title="Central Region"
                  subtitle="uttarakhand, uttar pradesh"
                  isSelected={selectedRegion === 'central'}
                  onClick={() => {
                    if (!isRegionTransitioning) {
                      setIsRegionTransitioning(true);
                      setSelectedRegion(selectedRegion === 'central' ? null : 'central');
                      setTimeout(() => setIsRegionTransitioning(false), 1600);
                    }
                  }}
                  disabled={isRegionTransitioning}
                />
                
                <RegionButton
                  id="eastern"
                  title="Eastern Region"
                  subtitle="west bengal, north east states"
                  isSelected={selectedRegion === 'eastern'}
                  onClick={() => {
                    if (!isRegionTransitioning) {
                      setIsRegionTransitioning(true);
                      setSelectedRegion(selectedRegion === 'eastern' ? null : 'eastern');
                      setTimeout(() => setIsRegionTransitioning(false), 1600);
                    }
                  }}
                  disabled={isRegionTransitioning}
                />
              </div>
            </div>
          </div>

          {/* Landslide Analysis Section */}
          <div className="px-6 pb-6">
            <h2 className="text-lg font-semibold text-green-400 mb-4">LANDSLIDE ANALYSIS</h2>
            
            {/* Predict Form */}
            <div className="mb-4">
              <PredictForm />
            </div>
            
            {/* NetCDF Uploader */}
            <div className="mb-4">
              <NetCDFUploader />
            </div>
          </div>
        </div>

        {/* Bottom Section - Fixed at bottom */}
        <div className="bg-gray-800">
          {/* Boundary Legend */}
          <div className="p-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-green-400 mb-4">BOUNDARY LEGEND</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-0.5 bg-orange-500 mr-3"></div>
                <span className="text-sm text-gray-300">India Border</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-0.5 bg-blue-500 mr-3"></div>
                <span className="text-sm text-gray-300">State Boundaries</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-0.5 bg-yellow-500 mr-3"></div>
                <span className="text-sm text-gray-300">District Boundaries</span>
              </div>
            </div>
          </div>

          {/* Feature Importance Button */}
          <div className="p-6 border-t border-gray-700">
            <button
              onClick={openImageModal}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 mb-4"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
              <span>Feature Importance</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
              <span>LOG OUT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal - Fixed for opacity */}
      {showImageModal && (
        <div 
          className="fixed top-0 left-0 w-full h-full bg-black z-[9999] flex items-center justify-center"
          onClick={closeImageModal}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] p-4 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors duration-200 z-10"
            >
              <svg 
                className="w-8 h-8" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>

            {/* Modal Content - Made completely opaque */}
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl opacity-100">
              <div className="p-4 border-b border-gray-700 bg-gray-800">
                <h3 className="text-xl font-semibold text-green-400">Feature Importance Analysis</h3>
                <p className="text-gray-300 text-sm mt-1">XGBoost Model Feature Rankings for Landslide Prediction</p>
              </div>
              
              <div className="p-4 bg-gray-800">
                <img 
                  src="/feature_imp_xg.png"
                  alt="Feature Importance Chart"
                  className="w-full h-auto max-h-[70vh] object-contain rounded bg-white"
                  onError={(e) => {
                    // Fallback to placeholder if image doesn't exist
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23374151'/%3E%3Ctext x='400' y='280' font-family='Arial, sans-serif' font-size='24' fill='%2310b981' text-anchor='middle'%3EFeature Importance Chart%3C/text%3E%3Ctext x='400' y='320' font-family='Arial, sans-serif' font-size='16' fill='%239ca3af' text-anchor='middle'%3EImage not found: /feature_imp_xg.png%3C/text%3E%3Ctext x='400' y='350' font-family='Arial, sans-serif' font-size='14' fill='%236b7280' text-anchor='middle'%3EPlace your image in: public/feature_imp_xg.png%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-green-400">{currentCommand.command}</h2>
              <p className="text-gray-300">{currentCommand.subtitle}</p>
            </div>
            
            {/* Map Layer Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-300 mr-2">Map Layer:</span>
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button 
                  onClick={() => setMapLayer('satellite')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    mapLayer === 'satellite'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Satellite
                </button>
                <button 
                  onClick={() => setMapLayer('street')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    mapLayer === 'street'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Street
                </button>
                <button 
                  onClick={() => setMapLayer('tiff')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    mapLayer === 'tiff'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  TIFF Overlay
                </button>
                <button 
                  onClick={() => setMapLayer('sachet')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    mapLayer === 'sachet'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  SACHET
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {/* SACHET Upload Panel - Show when SACHET layer is selected */}
          {mapLayer === 'sachet' && (
            <div className="absolute top-4 left-4 right-4 z-[1000]">
              <SachetUploadPanel 
                onGeoJSONDataProcessed={(data) => setSachetGeoJSONData(data)}
              />
            </div>
          )}
          
          <MapComponent 
            selectedRegion={selectedRegion} 
            mapLayer={mapLayer}
            sachetGeoJSONData={sachetGeoJSONData}
            onHoverCoordinatesChange={setHoverCoordinates}
            isOffline={isOffline}
            currentZoom={currentZoom}
            onZoomChange={setCurrentZoom}
            onLoadingChange={setIsLoading}
          />
        </div>
      </div>

      {/* Coordinates Display */}
      <CoordinatesDisplay 
        lat={hoverCoordinates?.lat || null} 
        lng={hoverCoordinates?.lng || null} 
      />

      {/* Dev Console */}
      <DevConsole 
        isOffline={isOffline}
        onOfflineModeChange={setIsOffline}
        currentZoom={currentZoom}
        onZoomChange={setCurrentZoom}
      />
    </div>
  );
}

interface CollapsibleRegionProps {
  id: string;
  title: string;
  subtitle: string;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onRegionSelect: () => void;
  disabled?: boolean;
}

function CollapsibleRegion({ 
  id, 
  title, 
  subtitle, 
  isExpanded, 
  isSelected, 
  onToggleExpand, 
  onRegionSelect, 
  disabled = false 
}: CollapsibleRegionProps) {
  return (
    <div className={`border rounded-lg transition-all duration-200 ${
      isSelected
        ? 'border-green-500 bg-green-500/10 shadow-lg'
        : disabled
        ? 'border-gray-700 bg-gray-800/50 opacity-50'
        : 'border-gray-600 hover:border-gray-500'
    }`}>
      {/* Header - Always visible */}
      <button
        onClick={onToggleExpand}
        disabled={disabled}
        className={`w-full p-4 text-left transition-all duration-200 flex items-center justify-between ${
          disabled ? 'cursor-not-allowed' : 'hover:bg-gray-700/30'
        }`}
      >
        <div>
          <div className="font-semibold text-white">{title}</div>
          <div className="text-sm text-gray-400">{subtitle}</div>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content */}
      <div className={`overflow-hidden transition-all duration-300 ${
        isExpanded ? 'max-h-40' : 'max-h-0'
      }`}>
        <div className="px-4 pb-4 border-t border-gray-600">
          <div className="mt-3 space-y-2">
            <div className="text-sm text-gray-300">
              <span className="font-medium">States:</span> {subtitle}
            </div>
            <button
              onClick={onRegionSelect}
              disabled={disabled}
              className={`w-full mt-3 py-2 px-3 rounded text-sm font-medium transition-colors duration-200 ${
                isSelected
                  ? 'bg-green-600 text-white'
                  : disabled
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {isSelected ? 'Selected' : 'Select Region'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RegionButtonProps {
  id: string;
  title: string;
  subtitle: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function RegionButton({ id, title, subtitle, isSelected, onClick, disabled = false }: RegionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 border rounded-lg text-left transition-all duration-200 ${
        isSelected
          ? 'border-green-500 bg-green-500/10 shadow-lg'
          : disabled
          ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-50'
          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
      } ${disabled ? 'pointer-events-none' : ''}`}
    >
      <div className="font-semibold text-white">{title}</div>
      <div className="text-sm text-gray-400">{subtitle}</div>
    </button>
  );
}