export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
  city: string;
  district: string;
  state: string;
  village?: string;
  country: string;
  formattedAddress: string;
}

// Calculate Haversine distance in kilometers between two lat/lng points
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal place
};

export const locationService = {
  // Get raw browser GPS / device coordinates with high accuracy
  getCoordinates: (timeoutMs = 15000): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => {
          let msg = 'Failed to retrieve location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              msg = 'Location permission was denied. Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              msg = 'Location information is currently unavailable.';
              break;
            case error.TIMEOUT:
              msg = 'Location request timed out. Please try again.';
              break;
          }
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 0
        }
      );
    });
  },

  // Reverse geocode latitude and longitude to find city, district, village, state, and address
  reverseGeocode: async (latitude: number, longitude: number): Promise<LocationResult> => {
    // 1. Try BigDataCloud Client API (fast, free, CORS-enabled, reliable)
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const res = await fetch(bdcUrl);
      if (res.ok) {
        const data = await res.json();
        
        const city =
          data.city ||
          data.locality ||
          data.principalSubdivision ||
          '';
        
        // Find district from localityInfo administrative levels if available
        let district = data.locality || '';
        if (data.localityInfo?.administrative) {
          const admin2 = data.localityInfo.administrative.find(
            (a: any) => a.adminLevel === 6 || a.adminLevel === 5 || a.adminLevel === 4
          );
          if (admin2 && admin2.name) {
            district = admin2.name.replace(/ District/i, '');
          }
        }
        if (!district) district = city;

        const state = data.principalSubdivision || '';
        const village = data.locality || '';
        const country = data.countryName || 'India';
        
        const parts = [village, district, city, state, country].filter(
          (item, idx, arr) => item && arr.indexOf(item) === idx
        );
        const formattedAddress = parts.join(', ');

        return {
          latitude,
          longitude,
          city: city || district || 'Local Region',
          district: district || city || '',
          state: state || '',
          village: village || '',
          country: country || '',
          formattedAddress: formattedAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        };
      }
    } catch (e) {
      console.warn('BigDataCloud reverse geocode failed, falling back to Nominatim', e);
    }

    // 2. Fallback to OpenStreetMap Nominatim
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const res = await fetch(nomUrl, {
        headers: {
          'Accept-Language': 'en'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        const city =
          addr.city ||
          addr.town ||
          addr.municipality ||
          addr.village ||
          addr.suburb ||
          addr.county ||
          '';

        const district =
          addr.state_district ||
          addr.county ||
          addr.district ||
          city ||
          '';

        const village =
          addr.village ||
          addr.hamlet ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          '';

        const state = addr.state || '';
        const country = addr.country || 'India';
        const formattedAddress = data.display_name || `${city}, ${state}`;

        return {
          latitude,
          longitude,
          city: city || district || 'Local Region',
          district: district.replace(/ District/i, '') || city,
          state,
          village,
          country,
          formattedAddress
        };
      }
    } catch (e) {
      console.warn('Nominatim reverse geocode failed', e);
    }

    // 3. Fallback when network lookup is unavailable
    return {
      latitude,
      longitude,
      city: 'Current Location',
      district: '',
      state: '',
      village: '',
      country: '',
      formattedAddress: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
    };
  },

  // Full accurate location acquisition helper
  getExactLocation: async (): Promise<LocationResult> => {
    const pos = await locationService.getCoordinates();
    const { latitude, longitude, accuracy } = pos.coords;
    const details = await locationService.reverseGeocode(latitude, longitude);
    return {
      ...details,
      accuracy
    };
  }
};
