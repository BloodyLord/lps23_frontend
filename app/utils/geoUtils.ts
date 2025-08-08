// Utility functions for geographic operations

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: number[][][] | number[][];
  };
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// Load GeoJSON data from API (placeholder for actual implementation)
export async function loadGeoJSONFromAPI(type: 'country' | 'state' | 'district'): Promise<GeoJSONCollection | null> {
  try {
    // Placeholder URLs - replace with actual API endpoints
    const urls = {
      country: 'https://api.example.com/geojson/india-border.json',
      state: 'https://api.example.com/geojson/india-states.json',
      district: 'https://api.example.com/geojson/india-districts.json'
    };
    
    const response = await fetch(urls[type]);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} boundaries`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${type} GeoJSON:`, error);
    return null;
  }
}

// Load GeoJSON data from local files (for offline support)
export async function loadGeoJSONFromFile(filename: string): Promise<GeoJSONCollection | null> {
  try {
    const response = await fetch(`/geojson/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error loading GeoJSON file ${filename}:`, error);
    return null;
  }
}

// Generate simplified boundary rectangles (placeholder for actual GeoJSON)
export function generateSimplifiedBoundaries(): {
  country: GeoJSONCollection;
  states: GeoJSONCollection;
  districts: GeoJSONCollection;
} {
  // India country boundary (simplified)
  const country: GeoJSONCollection = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { name: 'India' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [68.1766451354, 7.96553477623],
          [97.4025614766, 7.96553477623],
          [97.4025614766, 37.6017073906],
          [68.1766451354, 37.6017073906],
          [68.1766451354, 7.96553477623]
        ]]
      }
    }]
  };

  // State boundaries (simplified regions)
  const states: GeoJSONCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Northern Region' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [72.5, 32.0],
            [80.0, 32.0],
            [80.0, 37.3],
            [72.5, 37.3],
            [72.5, 32.0]
          ]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'Central Region' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [76.0, 28.4],
            [81.0, 28.4],
            [81.0, 33.0],
            [76.0, 33.0],
            [76.0, 28.4]
          ]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'Eastern Region' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [88.0, 21.5],
            [97.5, 21.5],
            [97.5, 29.0],
            [88.0, 29.0],
            [88.0, 21.5]
          ]]
        }
      }
    ]
  };

  // District boundaries (grid pattern)
  const districts: GeoJSONCollection = {
    type: 'FeatureCollection',
    features: []
  };

  // Generate grid-based districts
  for (let lat = 20; lat < 38; lat += 2) {
    for (let lng = 70; lng < 98; lng += 2) {
      districts.features.push({
        type: 'Feature',
        properties: { name: `District ${lat}-${lng}` },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lng, lat],
            [lng + 2, lat],
            [lng + 2, lat + 2],
            [lng, lat + 2],
            [lng, lat]
          ]]
        }
      });
    }
  }

  return { country, states, districts };
}

// Check if a point is within bounds
export function isPointInBounds(lat: number, lng: number, bounds: Bounds): boolean {
  return lat >= bounds.south && lat <= bounds.north && 
         lng >= bounds.west && lng <= bounds.east;
}

// Calculate the center point of bounds
export function getBoundsCenter(bounds: Bounds): [number, number] {
  const centerLat = (bounds.north + bounds.south) / 2;
  const centerLng = (bounds.east + bounds.west) / 2;
  return [centerLat, centerLng];
}

// Convert bounds to Leaflet LatLngBounds format
export function boundsToLeafletBounds(bounds: Bounds): [[number, number], [number, number]] {
  return [[bounds.south, bounds.west], [bounds.north, bounds.east]];
}