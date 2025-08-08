'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, GeoJSON, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Feature, Polygon, MultiPolygon } from 'geojson';
import 'leaflet/dist/leaflet.css';
import SimpleTileLayer from './SimpleTileLayer';
import { loadRegionData, findNearestLocation, LocationData } from '../utils/dataUtils';
import { loadAllBoundaries, BoundaryData } from '../utils/boundaryUtils';
import DataOverlay from './DataOverlay';
import MarkerLoadingOverlay from './MarkerLoadingOverlay';
import { usePrediction, useDaySelection } from '../context/PredictionContext';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createRiskIcon = (color: string) => {
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" class="w-8 h-8">
      <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 005.16-4.212c1.558-2.226 2.34-4.88 2.34-7.585 0-5.842-4.736-10.582-10.582-10.582S1.58 4.67 1.58 10.512c0 2.704.782 5.36 2.34 7.585a16.975 16.975 0 005.16 4.212zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
    </svg>`,
    className: 'bg-transparent border-0',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const highRiskIcon = createRiskIcon('#ef4444'); // Red
const lowRiskIcon = createRiskIcon('#22c55e'); // Green

interface RegionBounds {
  north: number;
  south: number;
  west: number;
  east: number;
}

const REGIONS: Record<string, RegionBounds> = {
  northern: { north: 37.8, south: 31.5, west: 71.5, east: 81.0 },
  central: { north: 32.0, south: 27.5, west: 76.0, east: 82.0 },
  eastern: { north: 30.0, south: 20.5, west: 86.5, east: 98.5 },
};

interface MapComponentProps {
  selectedRegion: string | null;
  mapLayer: 'satellite' | 'street' | 'tiff' | 'sachet';
  sachetGeoJSONData: Feature<Polygon | MultiPolygon>[];
  onHoverCoordinatesChange: (coords: { lat: number; lng: number } | null) => void;
  isOffline: boolean;
  onZoomChange?: (zoom: number) => void;
  currentZoom?: number;
  onLoadingChange: (loading: boolean) => void;
}

interface MarkerData {
  lat: number;
  lng: number;
  data: LocationData | null;
}

// Helper function to format probability as percentage with 3 decimal places
const formatProbabilityPercentage = (probability: number | null | undefined): string => {
  if (probability === null || probability === undefined || isNaN(probability)) {
    return 'N/A';
  }
  return (parseFloat(probability.toString()) * 100).toFixed(3) + '%';
};

export default function MapComponent({ 
  selectedRegion, 
  mapLayer, 
  sachetGeoJSONData,
  onHoverCoordinatesChange,
  isOffline, 
  onZoomChange,
  currentZoom = 8,
  onLoadingChange 
}: MapComponentProps) {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [showDataOverlay, setShowDataOverlay] = useState(false);
  const [regionData, setRegionData] = useState<LocationData[]>([]);
  const [boundaries, setBoundaries] = useState<{
    country: BoundaryData | null;
    states: BoundaryData | null;
    districts: BoundaryData | null;
  }>({ country: null, states: null, districts: null });
  const [isMarkerLoading, setIsMarkerLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  
  const { predictionResults, panToLocation } = usePrediction();
  const { selectedDay, availableDays } = useDaySelection();
  
  console.log('Prediction Results:', predictionResults);
  console.log('Selected Day:', selectedDay, 'Available Days:', availableDays);

  // Filter predictions based on selected day
  const filteredPredictions = selectedDay !== null && availableDays.length > 0 
    ? predictionResults.filter(result => result.day === availableDays[selectedDay].date)
    : predictionResults;

  console.log('Filtered Predictions:', filteredPredictions);

  useEffect(() => {
    const initializeBoundaries = async () => {
      onLoadingChange(true);
      try {
        const boundaryData = await loadAllBoundaries(isOffline);
        setBoundaries(boundaryData);
        setMapReady(true);
      } catch (error) {
        console.error('Error initializing map data:', error);
      } finally {
        onLoadingChange(false);
      }
    };
    initializeBoundaries();
  }, [onLoadingChange, isOffline]);

  useEffect(() => {
    const loadRegionSpecificData = async () => {
      if (!selectedRegion) {
        setRegionData([]);
        return;
      }
      onLoadingChange(true);
      try {
        const data = await loadRegionData(selectedRegion);
        setRegionData(data);
      } catch (error) {
        console.error(`Error loading ${selectedRegion} data:`, error);
        setRegionData([]);
      } finally {
        onLoadingChange(false);
      }
    };
    loadRegionSpecificData();
  }, [selectedRegion, onLoadingChange]);
  
  const handleMapClick = async (lat: number, lng: number) => {
    // Disable map click when SACHET layer is active
    if (mapLayer === 'sachet') {
      return;
    }
    
    setIsMarkerLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const nearestData = findNearestLocation(regionData, lat, lng);
      const newMarker: MarkerData = { lat, lng, data: nearestData };
      setMarkers(prev => [...prev, newMarker]);
      setSelectedMarker(newMarker);
      setShowDataOverlay(true);
    } catch (error) {
      console.error('Error processing marker click:', error);
    } finally {
      setIsMarkerLoading(false);
    }
  };

  if (!mapReady) {
    return null;
  }

  return (
    <div className="relative h-full">
      <MapContainer
        center={[28.6139, 77.2090]}
        zoom={currentZoom}
        className="h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
      >
        <MapController 
          selectedRegion={selectedRegion} 
          onMapClick={handleMapClick}
          onMapReady={setMapInstance}
          onZoomChange={onZoomChange}
          panToLocation={panToLocation}
          onHoverCoordinatesChange={onHoverCoordinatesChange}
        />
        
        <SimpleTileLayer type={mapLayer} isOffline={isOffline} />
        
        {mapLayer === 'tiff' && mapLayer !== 'sachet' && (
          <SimpleTileLayer type="satellite" opacity={0.7} isOffline={isOffline} />
        )}

        <BoundaryLayers boundaries={boundaries} />

        {/* Render SACHET GeoJSON data when SACHET layer is active */}
        {mapLayer === 'sachet' && sachetGeoJSONData.map((feature, index) => (
          <GeoJSON
            key={`sachet-${index}`}
            data={feature}
            style={{
              color: '#ff6b6b',
              weight: 2,
              opacity: 0.8,
              fillColor: '#ff6b6b',
              fillOpacity: 0.2,
            }}
            onEachFeature={(feature, layer) => {
              const props = feature.properties;
              if (props) {
                const popupContent = `
                  <div class="text-sm font-sans max-w-sm">
                    ${props.headline ? `<h3 class="font-bold text-base mb-2 text-red-600">${props.headline}</h3>` : ''}
                    ${props.event ? `<p class="mb-2"><strong>Event:</strong> ${props.event}</p>` : ''}
                    ${props.severity ? `<p class="mb-2"><strong>Severity:</strong> <span class="font-semibold text-orange-600">${props.severity}</span></p>` : ''}
                    ${props.urgency ? `<p class="mb-2"><strong>Urgency:</strong> ${props.urgency}</p>` : ''}
                    ${props.certainty ? `<p class="mb-2"><strong>Certainty:</strong> ${props.certainty}</p>` : ''}
                    ${props.areaDesc ? `<p class="mb-2"><strong>Area:</strong> ${props.areaDesc}</p>` : ''}
                    ${props.description ? `<p class="mb-2"><strong>Description:</strong> ${props.description}</p>` : ''}
                    ${props.instruction ? `<p class="mb-2"><strong>Instructions:</strong> ${props.instruction}</p>` : ''}
                    ${props.effective ? `<p class="mb-1"><strong>Effective:</strong> ${new Date(props.effective).toLocaleString()}</p>` : ''}
                    ${props.expires ? `<p class="mb-1"><strong>Expires:</strong> ${new Date(props.expires).toLocaleString()}</p>` : ''}
                    ${props.sender ? `<p class="text-xs text-gray-600 mt-2">Source: ${props.sender}</p>` : ''}
                  </div>
                `;
                layer.bindPopup(popupContent, { maxWidth: 400 });
              }
            }}
          />
        ))}

        {/* Render prediction markers */}
        {filteredPredictions.map((result, index) => (
          <div key={`prediction-group-${selectedDay}-${index}`}>
            {/* 2km Buffer Zone Circle */}
            <Circle
              center={[result.lat, result.lon]}
              radius={2000} // 2km in meters
              pathOptions={{
                color: result.prediction === 0 ? '#22c55e' : '#ef4444',
                weight: 1,
                opacity: 0.6,
                fillColor: result.prediction === 0 ? '#22c55e' : '#ef4444',
                fillOpacity: 0.1,
              }}
            />
            
            {/* Prediction Marker */}
            <Marker
              position={[result.lat, result.lon]}
              icon={result.prediction === 0 ? lowRiskIcon : highRiskIcon}
            >
              <Popup>
                <div className="text-sm font-sans">
                  <p className="font-bold text-base mb-2">
                    Prediction: <span style={{ color: result.prediction === 0 ? '#22c55e' : '#ef4444' }}>
                      {result.prediction === 0 ? 'Low Risk' : 'High Risk'}
                    </span>
                  </p>
                  <div className="space-y-1">
                    <p><strong>Location:</strong> {result.lat.toFixed(5)}, {result.lon.toFixed(5)}</p>
                    <p><strong>Date:</strong> {result.day}</p>
                    {result.landslide_probability !== null && result.landslide_probability !== undefined && (
                      <p><strong>Probability (%):</strong> 
                        <span className="font-mono ml-1 font-bold">{formatProbabilityPercentage(result.landslide_probability)}</span>
                      </p>
                    )}
                    {selectedDay !== null && availableDays.length > 0 && (
                      <p><strong>Day:</strong> {selectedDay + 1} of {availableDays.length}</p>
                    )}
                    <p><strong>Buffer Zone:</strong> 2km radius</p>
                  </div>
                  
                  {/* Weather Data Section */}
                  {result.weather_data && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <p className="font-medium text-gray-700 mb-1">Weather Data:</p>
                      <div className="text-xs space-y-1">
                        {result.weather_data.temperature_max && (
                          <p>🌡️ Max Temp: {result.weather_data.temperature_max.toFixed(1)}°C</p>
                        )}
                        {result.weather_data.temperature_min && (
                          <p>🌡️ Min Temp: {result.weather_data.temperature_min.toFixed(1)}°C</p>
                        )}
                        {result.weather_data.precipitation && (
                          <p>🌧️ Precipitation: {result.weather_data.precipitation.toFixed(2)}mm</p>
                        )}
                        {result.weather_data.snowfall && (
                          <p>❄️ Snowfall: {result.weather_data.snowfall.toFixed(2)}cm</p>
                        )}
                        {result.weather_data.wind_speed && (
                          <p>💨 Wind Speed: {result.weather_data.wind_speed.toFixed(1)}km/h</p>
                        )}
                        {result.weather_data.pressure && (
                          <p>📊 Pressure: {result.weather_data.pressure.toFixed(1)}hPa</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          </div>
        ))}

        {/* Regular markers from map clicks */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={[marker.lat, marker.lng]}
            eventHandlers={{
              click: () => {
                setSelectedMarker(marker);
                setShowDataOverlay(true);
              },
            }}
          >
            <Popup>
              <div className="text-sm">
                <p><strong>Coordinates:</strong> {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}</p>
                {marker.data && (
                  <p><strong>Nearest Data Point:</strong> {marker.data.location}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <MarkerLoadingOverlay isVisible={isMarkerLoading} />

      {showDataOverlay && selectedMarker && (
        <DataOverlay
          marker={selectedMarker}
          onClose={() => setShowDataOverlay(false)}
        />
      )}
    </div>
  );
}

interface MapControllerProps {
  selectedRegion: string | null;
  onMapClick: (lat: number, lng: number) => void;
  onMapReady?: (map: L.Map) => void;
  onZoomChange?: (zoom: number) => void;
  panToLocation: [number, number] | null;
  onHoverCoordinatesChange: (coords: { lat: number; lng: number } | null) => void;
}

function MapController({ selectedRegion, onMapClick, onMapReady, onZoomChange, panToLocation, onHoverCoordinatesChange }: MapControllerProps) {
  const map = useMap();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  // Handle hover coordinates
  useEffect(() => {
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      onHoverCoordinatesChange({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    };

    const handleMouseOut = () => {
      onHoverCoordinatesChange(null);
    };

    map.on('mousemove', handleMouseMove);
    map.on('mouseout', handleMouseOut);

    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('mouseout', handleMouseOut);
    };
  }, [map, onHoverCoordinatesChange]);

  useEffect(() => {
    if (panToLocation) {
      map.flyTo(panToLocation, 12, { animate: true, duration: 1.5 });
    }
  }, [panToLocation, map]);

  useEffect(() => {
    if (selectedRegion && REGIONS[selectedRegion]) {
      setIsTransitioning(true);
      const region = REGIONS[selectedRegion];
      const bounds = L.latLngBounds([region.south, region.west], [region.north, region.east]);
      map.setMaxBounds(bounds);
      map.flyToBounds(bounds, { padding: [30, 30], duration: 1.5, maxZoom: 11 });
      setTimeout(() => {
        map.setMaxBounds(bounds.pad(0.25));
        setIsTransitioning(false);
      }, 1600);
    } else {
      setIsTransitioning(true);
      map.flyTo([28.6139, 77.2090], 6, { duration: 1.5 });
      setTimeout(() => setIsTransitioning(false), 1600);
    }
  }, [selectedRegion, map]);

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!isTransitioning) onMapClick(e.latlng.lat, e.latlng.lng);
    };
    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [map, onMapClick, isTransitioning]);

  useEffect(() => {
    const handleZoomEnd = () => { if (onZoomChange) onZoomChange(map.getZoom()); };
    map.on('zoomend', handleZoomEnd);
    return () => { map.off('zoomend', handleZoomEnd); };
  }, [map, onZoomChange]);

  return null;
}

interface BoundaryLayersProps {
  boundaries: {
    country: BoundaryData | null;
    states: BoundaryData | null;
    districts: BoundaryData | null;
  };
}

function BoundaryLayers({ boundaries }: BoundaryLayersProps) {
  return (
    <>
      {boundaries.country && <GeoJSON data={boundaries.country} style={{ color: '#f97316', weight: 4, fillOpacity: 0, opacity: 1, dashArray: '5, 5' }} />}
      {boundaries.states && <GeoJSON data={boundaries.states} style={{ color: '#3b82f6', weight: 3, fillOpacity: 0, opacity: 0.9 }} />}
      {boundaries.districts && <GeoJSON data={boundaries.districts} style={{ color: '#eab308', weight: 2, fillOpacity: 0, opacity: 0.7 }} />}
    </>
  );
}