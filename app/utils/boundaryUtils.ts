// Utility functions for loading boundary data from GitHub APIs

export interface BoundaryData {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      name: string;
      [key: string]: any;
    };
    geometry: {
      type: string;
      coordinates: any;
    };
  }>;
}

// GitHub repositories with Indian boundary data
const BOUNDARY_SOURCES = {
  country: 'https://raw.githubusercontent.com/geohacker/india/master/country/india.geojson',
  states: 'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson',
  districts: 'https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson'
};

// Cache for boundary data
const boundaryCache = new Map<string, BoundaryData>();

export async function loadBoundaryData(
  type: 'country' | 'states' | 'districts',
  onProgress?: (message: string) => void,
  isOffline: boolean = false
): Promise<BoundaryData | null> {
  // Check cache first
  if (boundaryCache.has(type)) {
    return boundaryCache.get(type)!;
  }

  try {
    if (isOffline) {
      // Try to load from local GeoJSON files first
      onProgress?.(`Loading ${type} boundaries from local files...`);
      const localData = await loadLocalBoundaryData(type);
      if (localData) {
        boundaryCache.set(type, localData);
        onProgress?.(`${type} boundaries loaded from local files`);
        return localData;
      }
      onProgress?.(`Local ${type} boundaries not found, using fallback`);
      const fallbackData = generateFallbackBoundaries(type);
      boundaryCache.set(type, fallbackData);
      return fallbackData;
    }
    
    onProgress?.(`Loading ${type} boundaries from online...`);
    const response = await fetch(BOUNDARY_SOURCES[type]);
    if (!response.ok) {
      console.log(`Failed to fetch ${type} boundaries: ${response.statusText}, using fallback data`);
      onProgress?.(`Using fallback ${type} boundaries`);
      const fallbackData = generateFallbackBoundaries(type);
      boundaryCache.set(type, fallbackData);
      return fallbackData;
    }

    const data: BoundaryData = await response.json();
    
    // Validate the data structure
    if (!data.type || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      throw new Error(`Invalid GeoJSON format for ${type}`);
    }

    // Cache the data
    boundaryCache.set(type, data);
    
    onProgress?.(`${type} boundaries loaded successfully`);
    return data;
  } catch (error) {
    console.error(`Error loading ${type} boundaries:`, error);
    onProgress?.(`Failed to load ${type} boundaries`);
    
    // Return fallback simplified boundaries
    return generateFallbackBoundaries(type);
  }
}

// Load boundary data from local GeoJSON files
async function loadLocalBoundaryData(type: 'country' | 'states' | 'districts'): Promise<BoundaryData | null> {
  const localPaths = {
    country: '/geojson/gadm41_IND_0.geojson',
    states: '/geojson/gadm41_IND_1.geojson',
    districts: '/geojson/gadm41_IND_2.geojson'
  };

  try {
    const response = await fetch(localPaths[type]);
    if (!response.ok) {
      return null;
    }

    const data: BoundaryData = await response.json();
    
    // Validate and normalize the data structure
    if (!data.type || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      console.warn(`Invalid local GeoJSON format for ${type}`);
      return null;
    }

    // Normalize the data to ensure consistent property names
    const normalizedData: BoundaryData = {
      type: 'FeatureCollection',
      features: data.features.map(feature => ({
        type: 'Feature',
        properties: {
          // name: feature.properties.NAME_1 || 
          //       feature.properties.NAME_2 || 
          //       feature.properties.NAME_0 || 
          //       feature.properties.name || 
          //       'Unknown',
          ...feature.properties
        },
        geometry: feature.geometry
      }))
    };

    return normalizedData;
  } catch (error) {
    console.log(`Local ${type} boundary file not found or invalid`);
    return null;
  }
}
// Generate simplified fallback boundaries if GitHub API fails
function generateFallbackBoundaries(type: 'country' | 'states' | 'districts'): BoundaryData {
  switch (type) {
    case 'country':
      return {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { name: 'India' },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [68.1766, 7.9655],
              [97.4026, 7.9655],
              [97.4026, 37.6017],
              [68.1766, 37.6017],
              [68.1766, 7.9655]
            ]]
          }
        }]
      };

    case 'states':
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Jammu and Kashmir' },
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
            properties: { name: 'Himachal Pradesh' },
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
            properties: { name: 'West Bengal' },
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

    case 'districts':
      const districts: BoundaryData = {
        type: 'FeatureCollection',
        features: []
      };

      // Generate simplified district grid
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

      return districts;

    default:
      return { type: 'FeatureCollection', features: [] };
  }
}

// Load all boundary data with progress tracking
export async function loadAllBoundaries(
  isOffline: boolean = false,
  onProgress?: (message: string, progress: number) => void
): Promise<{
  country: BoundaryData | null;
  states: BoundaryData | null;
  districts: BoundaryData | null;
}> {
  const results = {
    country: null as BoundaryData | null,
    states: null as BoundaryData | null,
    districts: null as BoundaryData | null
  };

  try {
    onProgress?.('Loading country boundaries...', 10);
    results.country = await loadBoundaryData('country', (msg) => onProgress?.(msg, 20), isOffline);

    onProgress?.('Loading state boundaries...', 40);
    results.states = await loadBoundaryData('states', (msg) => onProgress?.(msg, 60), isOffline);

    onProgress?.('Loading district boundaries...', 80);
    results.districts = await loadBoundaryData('districts', (msg) => onProgress?.(msg, 90), isOffline);

    onProgress?.('Boundaries loaded successfully', 100);
  } catch (error) {
    console.error('Error loading boundaries:', error);
    onProgress?.('Error loading some boundaries', 100);
  }

  return results;
}

// Clear boundary cache
export function clearBoundaryCache(): void {
  boundaryCache.clear();
}