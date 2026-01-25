/**
 * Decodes a Google Maps encoded polyline string into an array of LatLng objects.
 * @param encoded - The encoded polyline string.
 * @returns Array of {lat, lng} objects.
 */
export function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ lat: lat / 1E5, lng: lng / 1E5 });
  }
  return points;
}

/**
 * Gets a custom truck icon based on status.
 * @param status - Booking status.
 * @param heading - Optional heading for rotation.
 * @returns Google Maps Icon object.
 */
export function getTruckIcon(status: string, heading: number = 0): google.maps.Symbol {
  let color = '#3b82f6'; // Default blue

  switch (status) {
    case 'in-transit':
      color = '#10b981'; // green
      break;
    case 'reached-pickup':
    case 'reached-destination':
      color = '#f59e0b'; // amber
      break;
    case 'loaded':
      color = '#8b5cf6'; // purple
      break;
    case 'assigned':
    case 'driver-en-route':
      color = '#3b82f6'; // blue
      break;
  }

  return {
    path: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.94 2.5H17V9.5h2.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#ffffff',
    scale: 1,
    anchor: new google.maps.Point(12, 12),
    rotation: heading,
  };
}
