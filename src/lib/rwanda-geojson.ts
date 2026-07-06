export const RWANDA_PROVINCES_GEOJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Kigali City", "code": "KG" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [30.0, -1.9], [30.1, -1.9], [30.1, -1.7], [30.0, -1.7], [30.0, -1.9]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Northern", "code": "NO" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [29.8, -1.7], [30.0, -1.7], [30.0, -1.2], [29.8, -1.2], [29.8, -1.7]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Eastern", "code": "EA" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [30.1, -1.7], [30.4, -1.7], [30.4, -2.1], [30.1, -2.1], [30.1, -1.7]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Southern", "code": "SO" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [29.6, -2.1], [30.0, -2.1], [30.0, -2.4], [29.6, -2.4], [29.6, -2.1]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Western", "code": "WE" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [29.2, -2.1], [29.6, -2.1], [29.6, -2.4], [29.2, -2.4], [29.2, -2.1]
        ]]
      }
    }
  ]
};

export const RWANDA_DISTRICTS_GEOJSON = {
  "type": "FeatureCollection",
  "features": [
    { "type": "Feature", "properties": { "name": "Nyarugenge", "province": "Kigali City" }, "geometry": { "type": "Polygon", "coordinates": [[[30.02, -1.92], [30.04, -1.92], [30.04, -1.90], [30.02, -1.90], [30.02, -1.92]]] },
    { "type": "Feature", "properties": { "name": "Munyeshyaka", "province": "Kigali City" }, "geometry": { "type": "Polygon", "coordinates": [[[30.04, -1.92], [30.06, -1.92], [30.06, -1.90], [30.04, -1.90], [30.04, -1.92]]] },
    { "type": "Feature", "properties": { "name": "Rubavu", "province": "Western" }, "geometry": { "type": "Polygon", "coordinates": [[[29.3, -1.65], [29.4, -1.65], [29.4, -1.62], [29.3, -1.62], [29.3, -1.65]]] },
    { "type": "Feature", "properties": { "name": "Karongi", "province": "Western" }, "geometry": { "type": "Polygon", "coordinates": [[[29.5, -1.95], [29.6, -1.95], [29.6, -1.92], [29.5, -1.92], [29.5, -1.95]]] },
    { "type": "Feature", "properties": { "name": "Rulindo", "province": "Northern" }, "geometry": { "type": "Polygon", "coordinates": [[[29.9, -1.55], [30.0, -1.55], [30.0, -1.52], [29.9, -1.52], [29.9, -1.55]]] },
    { "type": "Feature", "properties": { "name": "Gicukiro", "province": "Kigali City" }, "geometry": { "type": "Polygon", "coordinates": [[[30.02, -1.90], [30.04, -1.90], [30.04, -1.88], [30.02, -1.88], [30.02, -1.90]]] },
    { "type": "Feature", "properties": { "name": "Gasabo", "province": "Kigali City" }, "geometry": { "type": "Polygon", "coordinates": [[[30.04, -1.90], [30.06, -1.90], [30.06, -1.88], [30.04, -1.88], [30.04, -1.90]]] },
    { "type": "Feature", "properties": { "name": "Musanze", "province": "Northern" }, "geometry": { "type": "Polygon", "coordinates": [[[29.9, -1.52], [30.0, -1.52], [30.0, -1.48], [29.9, -1.48], [29.9, -1.52]]] },
    { "type": "Feature", "properties": { "name": "Nyamagabe", "province": "Southern" }, "geometry": { "type": "Polygon", "coordinates": [[[29.7, -2.25], [29.8, -2.25], [29.8, -2.22], [29.7, -2.22], [29.7, -2.25]]] },
    { "type": "Feature", "properties": { "name": "Huye", "province": "Southern" }, "geometry": { "type": "Polygon", "coordinates": [[[29.85, -2.55], [29.95, -2.55], [29.95, -2.52], [29.85, -2.52], [29.85, -2.55]]] },
    { "type": "Feature", "properties": { "name": "Rwamagana", "province": "Eastern" }, "geometry": { "type": "Polygon", "coordinates": [[[30.25, -1.95], [30.35, -1.95], [30.35, -1.92], [30.25, -1.92], [30.25, -1.95]]] },
    { "type": "Feature", "properties": { "name": "Kayonza", "province": "Eastern" }, "geometry": { "type": "Polygon", "coordinates": [[[30.35, -1.95], [30.45, -1.95], [30.45, -1.92], [30.35, -1.92], [30.35, -1.95]]] }
  ]
};