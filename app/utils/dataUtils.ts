import Papa from 'papaparse';

export interface LocationData {
  id: number;
  lat: number;
  lng: number;
  location: string;
  elevation: number;
  slopeAngle: number;
  rainfall: number;
  soilType: string;
  vegetation: string;
  landslideRisk: 'Low' | 'Medium' | 'High';
  avalancheRisk: 'Low' | 'Medium' | 'High';
  temperature: number;
  humidity: number;
  distance?: number;
  date?: string;
  forecast?: {
    day1: LocationData;
    day2: LocationData;
    day3: LocationData;
  };
}

// Generate dummy data for testing
export function generateDummyData(count: number): LocationData[] {
  const data: LocationData[] = [];
  const locations = [
    'Shimla', 'Manali', 'Dharamshala', 'Mussoorie', 'Nainital', 'Dehradun',
    'Rishikesh', 'Haridwar', 'Almora', 'Pithoragarh', 'Chamoli', 'Uttarkashi',
    'Tehri', 'Pauri', 'Bageshwar', 'Champawat', 'Rudraprayag', 'Srinagar',
    'Jammu', 'Leh', 'Kargil', 'Gangtok', 'Darjeeling', 'Kalimpong',
    'Kurseong', 'Siliguri', 'Jalpaiguri', 'Cooch Behar', 'Alipurduar',
    'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas', 'South 24 Parganas',
    'Howrah', 'Hooghly', 'Burdwan', 'Birbhum', 'Bankura', 'Purulia',
    'West Midnapore', 'East Midnapore', 'Jhargram', 'Kolkata', 'Agartala',
    'Aizawl', 'Imphal', 'Kohima', 'Itanagar', 'Dispur', 'Shillong'
  ];
  
  const soilTypes = ['Clay', 'Sandy', 'Loamy', 'Rocky', 'Alluvial', 'Laterite'];
  const vegetationTypes = ['Dense Forest', 'Sparse Forest', 'Grassland', 'Agricultural', 'Barren', 'Mixed'];
  const riskLevels: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];

  for (let i = 0; i < count; i++) {
    // Generate coordinates within India's approximate bounds
    const lat = 20 + Math.random() * 18; // 20°N to 38°N
    const lng = 68 + Math.random() * 30; // 68°E to 98°E
    
    data.push({
      id: i + 1,
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      location: locations[Math.floor(Math.random() * locations.length)] + ` ${i + 1}`,
      elevation: Math.floor(Math.random() * 8000) + 200, // 200m to 8200m
      slopeAngle: Math.floor(Math.random() * 60) + 5, // 5° to 65°
      rainfall: Math.floor(Math.random() * 3000) + 100, // 100mm to 3100mm
      soilType: soilTypes[Math.floor(Math.random() * soilTypes.length)],
      vegetation: vegetationTypes[Math.floor(Math.random() * vegetationTypes.length)],
      landslideRisk: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      avalancheRisk: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      temperature: Math.floor(Math.random() * 40) - 10, // -10°C to 30°C
      humidity: Math.floor(Math.random() * 80) + 20, // 20% to 100%
    });
  }

  // Sort by latitude for binary search optimization
  return data.sort((a, b) => a.lat - b.lat);
}

// Load region-specific data from CSV files
export async function loadRegionData(region: string, includeForecast: boolean = true): Promise<LocationData[]> {
  try {
    // Load base data
    const baseData = await loadSingleDayData(region, 'day1');
    
    if (!includeForecast) {
      return baseData;
    }
    
    // Load forecast data for 3 days
    const [day1Data, day2Data, day3Data] = await Promise.all([
      loadSingleDayData(region, 'day1'),
      loadSingleDayData(region, 'day2'),
      loadSingleDayData(region, 'day3')
    ]);
    
    // Combine data with forecast
    const combinedData: LocationData[] = day1Data.map((baseLocation, index) => {
      const day2Location = day2Data[index];
      const day3Location = day3Data[index];
      
      return {
        ...baseLocation,
        forecast: {
          day1: baseLocation,
          day2: day2Location || baseLocation,
          day3: day3Location || baseLocation
        }
      };
    });
    
    return combinedData;
  } catch (error) {
    console.error(`Error loading ${region} data:`, error);
    throw error;
  }
}

// Load single day data from CSV
async function loadSingleDayData(region: string, day: 'day1' | 'day2' | 'day3'): Promise<LocationData[]> {
  try {
    const response = await fetch(`/data/${region}-${day}.csv`);
    if (!response.ok) {
      // Fallback to base data if specific day not found
      const fallbackResponse = await fetch(`/data/${region}.csv`);
      if (!fallbackResponse.ok) {
        throw new Error(`Failed to fetch ${region} data: ${response.statusText}`);
      }
      const csvText = await fallbackResponse.text();
      return parseCsvData(csvText, day);
    }
    
    const csvText = await response.text();
    return parseCsvData(csvText, day);
  } catch (error) {
    console.error(`Error loading ${region}-${day} data:`, error);
    throw error;
  }
}

// Parse CSV data with proper typing and date assignment
function parseCsvData(csvText: string, day: 'day1' | 'day2' | 'day3'): Promise<LocationData[]> {
  const today = new Date();
  const dayOffset = day === 'day1' ? 0 : day === 'day2' ? 1 : 2;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + dayOffset);
  const dateString = targetDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
    
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        // Convert numeric fields
        if (['id', 'elevation', 'slopeAngle', 'rainfall', 'temperature', 'humidity'].includes(field as any)) {
          return parseInt(value);
        }
        if (['lat', 'lng'].includes(field as any)) {
          return parseFloat(value);
        }
        return value;
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('CSV parsing errors:', results.errors);
          reject(new Error('Failed to parse CSV data'));
          return;
        }
        
        const data = results.data as LocationData[];
        // Add date information and sort by latitude
        const dataWithDate = data.map(item => ({
          ...item,
          date: dateString
        }));
        const sortedData = dataWithDate.sort((a, b) => a.lat - b.lat);
        resolve(sortedData);
      },
      error: (error:any) => {
        reject(error);
      }
    });
  });
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest location using binary search approach for latitude, then linear search for longitude
export function findNearestLocation(data: LocationData[], targetLat: number, targetLng: number): LocationData | null {
  if (data.length === 0) return null;

  let minDistance = Infinity;
  let nearestLocation: LocationData | null = null;

  // Binary search for approximate latitude range
  let left = 0;
  let right = data.length - 1;
  
  // Find the closest latitude using binary search
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (data[mid].lat < targetLat) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // Check a range around the found position for the actual nearest point
  const searchRange = 50; // Check 50 points on each side
  const startIndex = Math.max(0, left - searchRange);
  const endIndex = Math.min(data.length - 1, left + searchRange);

  for (let i = startIndex; i <= endIndex; i++) {
    const distance = calculateDistance(targetLat, targetLng, data[i].lat, data[i].lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestLocation = { ...data[i], distance };
    }
  }

  return nearestLocation;
}

// Export data to CSV format (for future offline support)
export function exportToCSV(data: LocationData[]): string {
  const headers = [
    'id', 'lat', 'lng', 'location', 'elevation', 'slopeAngle', 'rainfall',
    'soilType', 'vegetation', 'landslideRisk', 'avalancheRisk', 'temperature', 'humidity'
  ];
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header as keyof LocationData]).join(','))
  ].join('\n');
  
  return csvContent;
}

// Import data from CSV format (for future offline support)
export function importFromCSV(csvContent: string): LocationData[] {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  const data: LocationData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index];
        if (header === 'id' || header === 'elevation' || header === 'slopeAngle' || 
            header === 'rainfall' || header === 'temperature' || header === 'humidity') {
          row[header] = parseInt(value);
        } else if (header === 'lat' || header === 'lng') {
          row[header] = parseFloat(value);
        } else {
          row[header] = value;
        }
      });
      data.push(row as LocationData);
    }
  }
  
  return data.sort((a, b) => a.lat - b.lat);
}