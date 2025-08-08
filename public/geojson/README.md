# Offline Boundary Data

This directory contains GeoJSON files for offline boundary rendering. When offline mode is enabled in the dev console, the system will load boundaries from these files instead of fetching from online APIs.

## Required Files

Place the following GeoJSON files in this directory for offline boundary support:

- `gadm41_IND_0.geojson` - India country boundary (admin level 0)
- `gadm41_IND_1.geojson` - Indian state boundaries (admin level 1)
- `gadm41_IND_2.geojson` - Indian district boundaries (admin level 2)

## GADM Format Support

The system now supports the GADM (Global Administrative Areas) format with the following structure:

```json
{
  "type": "FeatureCollection",
  "name": "gadm41_IND_1",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "GID_1": "IND.1_1",
        "GID_0": "IND",
        "COUNTRY": "India",
        "NAME_1": "AndamanandNicobar",
        "VARNAME_1": "Andaman&NicobarIslands|Andama",
        "NL_NAME_1": "NA",
        "TYPE_1": "UnionTerritor",
        "ENGTYPE_1": "UnionTerritory",
        "CC_1": "NA",
        "HASC_1": "IN.AN",
        "ISO_1": "NA"
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [...]
      }
    }
  ]
}
```

## Property Name Mapping

The system automatically maps GADM property names to standard names:
- `NAME_0` → Country name
- `NAME_1` → State/Province name  
- `NAME_2` → District/County name
- Falls back to `name` property if GADM names not found

## File Naming Convention

Use the GADM naming convention:
- Level 0 (Country): `gadm41_IND_0.geojson`
- Level 1 (States): `gadm41_IND_1.geojson`
- Level 2 (Districts): `gadm41_IND_2.geojson`

## Data Sources

You can obtain GADM boundary data from:

1. **GADM Official**: https://gadm.org/download_country.html
2. **Natural Earth Data**: https://www.naturalearthdata.com/
3. **OpenStreetMap**: https://www.openstreetmap.org/
4. **Government GIS Portals**: Various national mapping agencies

## Usage

1. Download GADM GeoJSON files for India
2. Place them in this directory with correct naming
3. Enable offline mode in the dev console
4. The system will automatically load boundaries from local files
5. If files are not found, fallback simplified boundaries will be used

## File Size Considerations

- GADM files can be large (several MB)
- Consider simplifying complex geometries if needed for web performance
- The system supports gzipped responses for faster loading
- You can use tools like `mapshaper` to simplify geometries while preserving accuracy

## Validation

The system validates that:
- Files are valid JSON
- Root object has `type: "FeatureCollection"`
- `features` array exists and contains valid Feature objects
- Each feature has proper `geometry` and `properties`
- Automatically normalizes property names for consistent display

## Coordinate Reference System

The system expects WGS84 (EPSG:4326) coordinates:
- Longitude: -180 to 180
- Latitude: -90 to 90
- GADM data typically uses this CRS by default

## Fallback Behavior

If offline files are not available or invalid:
1. System attempts to load from online APIs
2. If online fails, uses built-in simplified boundaries
3. User is notified of the data source being used via console messages