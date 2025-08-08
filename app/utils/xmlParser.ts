// app/utils/xmlParser.ts
import { Feature, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';

// Define a type for the properties extracted from CAP XML
interface CapProperties extends GeoJsonProperties {
  identifier?: string;
  sender?: string;
  sent?: string;
  status?: string;
  msgType?: string;
  scope?: string;
  category?: string;
  event?: string;
  urgency?: string;
  severity?: string;
  certainty?: string;
  effective?: string;
  onset?: string;
  expires?: string;
  headline?: string;
  description?: string;
  instruction?: string;
  areaDesc?: string;
  altitude?: string;
  ceiling?: string;
}

/**
 * Parses a CAP XML string and extracts GeoJSON features.
 * Converts cap:polygon strings (lat,lng lat,lng...) into GeoJSON [lng, lat] coordinates.
 *
 * @param xmlString The CAP XML content as a string.
 * @returns An array of GeoJSON Feature objects.
 */
export function parseCapXml(xmlString: string): Feature<Polygon | MultiPolygon, CapProperties>[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  const features: Feature<Polygon | MultiPolygon, CapProperties>[] = [];

  // Check for parsing errors
  const errorNode = xmlDoc.querySelector('parsererror');
  if (errorNode) {
    console.error('Error parsing XML:', errorNode.textContent);
    return [];
  }

  const alertElement = xmlDoc.querySelector('cap\\:alert, alert'); // Handle both prefixed and non-prefixed
  if (!alertElement) {
    console.warn('No <alert> element found in XML.');
    return [];
  }

  // Extract common alert-level properties
  const commonProperties: CapProperties = {
    identifier: alertElement.querySelector('cap\\:identifier, identifier')?.textContent || undefined,
    sender: alertElement.querySelector('cap\\:sender, sender')?.textContent || undefined,
    sent: alertElement.querySelector('cap\\:sent, sent')?.textContent || undefined,
    status: alertElement.querySelector('cap\\:status, status')?.textContent || undefined,
    msgType: alertElement.querySelector('cap\\:msgType, msgType')?.textContent || undefined,
    scope: alertElement.querySelector('cap\\:scope, scope')?.textContent || undefined,
  };

  const infoElements = alertElement.querySelectorAll('cap\\:info, info');

  infoElements.forEach(infoElement => {
    // Extract info-level properties
    const infoProperties: CapProperties = {
      category: infoElement.querySelector('cap\\:category, category')?.textContent || undefined,
      event: infoElement.querySelector('cap\\:event, event')?.textContent || undefined,
      urgency: infoElement.querySelector('cap\\:urgency, urgency')?.textContent || undefined,
      severity: infoElement.querySelector('cap\\:severity, severity')?.textContent || undefined,
      certainty: infoElement.querySelector('cap\\:certainty, certainty')?.textContent || undefined,
      effective: infoElement.querySelector('cap\\:effective, effective')?.textContent || undefined,
      onset: infoElement.querySelector('cap\\:onset, onset')?.textContent || undefined,
      expires: infoElement.querySelector('cap\\:expires, expires')?.textContent || undefined,
      headline: infoElement.querySelector('cap\\:headline, headline')?.textContent || undefined,
      description: infoElement.querySelector('cap\\:description, description')?.textContent || undefined,
      instruction: infoElement.querySelector('cap\\:instruction, instruction')?.textContent || undefined,
    };

    const areaElements = infoElement.querySelectorAll('cap\\:area, area');

    areaElements.forEach(areaElement => {
      const areaDesc = areaElement.querySelector('cap\\:areaDesc, areaDesc')?.textContent || undefined;
      const altitude = areaElement.querySelector('cap\\:altitude, altitude')?.textContent || undefined;
      const ceiling = areaElement.querySelector('cap\\:ceiling, ceiling')?.textContent || undefined;
      
      const polygonStrings = Array.from(areaElement.querySelectorAll('cap\\:polygon, polygon'))
        .map(poly => poly.textContent?.trim())
        .filter((text): text is string => !!text);

      if (polygonStrings.length === 0) {
        // If no polygons, but areaDesc exists, create a feature with just properties (no geometry)
        if (areaDesc) {
          features.push({
            type: 'Feature',
            properties: { ...commonProperties, ...infoProperties, areaDesc, altitude, ceiling },
            geometry: null,
          } as any); // Cast to any because geometry can be null
        }
        return;
      }

      const geoJsonPolygons: number[][][] = []; // For MultiPolygon coordinates

      polygonStrings.forEach(polyStr => {
        const coordinates: number[][] = polyStr.split(/\s+/).map(pair => {
          const [lat, lng] = pair.split(',').map(Number);
          if (isNaN(lat) || isNaN(lng)) {
            console.warn(`Invalid coordinate pair: ${pair}`);
            return null;
          }
          return [lng, lat]; // GeoJSON is [longitude, latitude]
        }).filter((coord): coord is number[] => coord !== null);

        if (coordinates.length < 3) {
          console.warn(`Polygon has insufficient coordinates: ${coordinates.length}`);
          return;
        }

        // Ensure the polygon is closed (first and last coordinate are the same)
        if (coordinates.length > 0) {
          const first = coordinates[0];
          const last = coordinates[coordinates.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            coordinates.push([first[0], first[1]]);
          }
        }

        geoJsonPolygons.push([coordinates]); // Wrap in array for polygon holes support
      });

      if (geoJsonPolygons.length === 0) {
        return;
      }

      let geometry: Polygon | MultiPolygon;
      if (geoJsonPolygons.length === 1) {
        geometry = {
          type: 'Polygon',
          coordinates: geoJsonPolygons[0],
        };
      } else {
        geometry = {
          type: 'MultiPolygon',
          coordinates: geoJsonPolygons,
        };
      }

      features.push({
        type: 'Feature',
        properties: { ...commonProperties, ...infoProperties, areaDesc, altitude, ceiling },
        geometry: geometry,
      });
    });
  });

  return features;
}