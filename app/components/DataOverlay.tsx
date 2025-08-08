'use client';

import { useState } from 'react';
import { LocationData } from '../utils/dataUtils';

interface MarkerData {
  lat: number;
  lng: number;
  data: LocationData | null;
}

interface DataOverlayProps {
  marker: MarkerData;
  onClose: () => void;
}

export default function DataOverlay({ marker, onClose }: DataOverlayProps) {
  const { data } = marker;
  const [selectedDay, setSelectedDay] = useState<'day1' | 'day2' | 'day3'>('day1');

  // Get forecast data for selected day
  const getCurrentForecast = () => {
    if (!data) return null;
    return data.forecast?.[selectedDay] || data;
  };

  const currentForecast = getCurrentForecast();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-green-400">Location Data Analysis</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Day Selection Tabs */}
          {data?.forecast && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Forecast Period</h3>
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setSelectedDay('day1')}
                  className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    selectedDay === 'day1'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setSelectedDay('day2')}
                  className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    selectedDay === 'day2'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  onClick={() => setSelectedDay('day3')}
                  className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    selectedDay === 'day3'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Day 3
                </button>
              </div>
            </div>
          )}

          {/* Coordinates */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Marker Coordinates</h3>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">Latitude:</span>
                  <span className="text-white ml-2 font-mono">{marker.lat.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Longitude:</span>
                  <span className="text-white ml-2 font-mono">{marker.lng.toFixed(6)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nearest Data Point */}
          {currentForecast ? (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Nearest Data Point {data?.forecast ? `- ${selectedDay === 'day1' ? 'Today' : selectedDay === 'day2' ? 'Tomorrow' : 'Day 3'}` : ''}
              </h3>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white ml-2">{currentForecast.location}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Distance:</span>
                    <span className="text-white ml-2">{currentForecast.distance?.toFixed(2) || data?.distance?.toFixed(2)} km</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Data Coordinates:</span>
                    <span className="text-white ml-2 font-mono">
                      {currentForecast.lat.toFixed(6)}, {currentForecast.lng.toFixed(6)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Elevation:</span>
                    <span className="text-white ml-2">{currentForecast.elevation} m</span>
                  </div>
                  {data?.forecast && (
                    <div className="md:col-span-2">
                      <span className="text-gray-400">Forecast Date:</span>
                      <span className="text-white ml-2">{currentForecast.date}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Data Status</h3>
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                <p className="text-red-400">No data available for this location</p>
              </div>
            </div>
          )}

          {/* Risk Assessment */}
          {currentForecast && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Landslide Risk Assessment {data?.forecast ? `(${selectedDay === 'day1' ? 'Today' : selectedDay === 'day2' ? 'Tomorrow' : 'Day 3'})` : ''}
              </h3>
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg text-gray-300">Current Risk Level</span>
                  <span className={`px-4 py-2 rounded-lg text-lg font-bold ${
                    currentForecast.landslideRisk === 'High' ? 'bg-red-600 text-white' :
                    currentForecast.landslideRisk === 'Medium' ? 'bg-yellow-600 text-white' :
                    'bg-green-600 text-white'
                  }`}>
                    {currentForecast.landslideRisk}
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full transition-all duration-300 ${
                      currentForecast.landslideRisk === 'High' ? 'bg-red-500' :
                      currentForecast.landslideRisk === 'Medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ 
                      width: currentForecast.landslideRisk === 'High' ? '85%' : 
                             currentForecast.landslideRisk === 'Medium' ? '60%' : '30%' 
                    }}
                  ></div>
                </div>
                <div className="mt-3 text-sm text-gray-400">
                  Risk factors: Elevation {currentForecast.elevation}m, Slope {currentForecast.slopeAngle}°, Rainfall {currentForecast.rainfall}mm
                </div>
              </div>
            </div>
          )}

          {/* Environmental Data */}
          {currentForecast && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Key Risk Factors {data?.forecast ? `(${selectedDay === 'day1' ? 'Today' : selectedDay === 'day2' ? 'Tomorrow' : 'Day 3'})` : ''}
              </h3>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Slope Angle:</span>
                      <span className="text-white font-semibold">{currentForecast.slopeAngle}°</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Rainfall:</span>
                      <span className="text-white font-semibold">{currentForecast.rainfall} mm</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Soil Type:</span>
                      <span className="text-white font-semibold">{currentForecast.soilType}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Vegetation:</span>
                      <span className="text-white font-semibold">{currentForecast.vegetation}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Close
            </button>
            {currentForecast && (
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center"
                onClick={() => {
                  // TODO: Implement past landslide data functionality
                  console.log('Loading past landslide data for:', currentForecast.location);
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Past Landslide Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}