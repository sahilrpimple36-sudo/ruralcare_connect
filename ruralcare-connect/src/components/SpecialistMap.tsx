import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Doctor, Hospital } from '../types';

interface SpecialistMapProps {
  userCoords?: { latitude: number; longitude: number };
  userAddress?: string;
  doctors: Doctor[];
  hospitals: Hospital[];
  onSelectDoctor: (doctor: Doctor) => void;
}

export const SpecialistMap: React.FC<SpecialistMapProps> = ({
  userCoords,
  userAddress,
  doctors,
  hospitals,
  onSelectDoctor
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center (India center if no user coords)
    const defaultCenter: [number, number] = userCoords
      ? [userCoords.latitude, userCoords.longitude]
      : [19.7515, 75.7139];
    const defaultZoom = userCoords ? 9 : 6;

    // Clean up existing map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Create custom SVG markers
    const createCustomIcon = (color: string, label: string) => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
          ">
            <span style="
              transform: rotate(45deg);
              font-size: 14px;
              color: white;
            ">${label}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
    };

    const markers: L.Marker[] = [];

    // 1. Add User Location Marker if available
    if (userCoords) {
      const userIcon = createCustomIcon('#0d9488', '📍');
      const userMarker = L.marker([userCoords.latitude, userCoords.longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <strong style="color: #0f766e; display: block; margin-bottom: 2px;">Your Exact Location</strong>
            <span>${userAddress || 'GPS Coordinates'}</span>
            <div style="color: #64748b; font-size: 10px; margin-top: 4px;">
              Lat: ${userCoords.latitude.toFixed(4)}, Lng: ${userCoords.longitude.toFixed(4)}
            </div>
          </div>
        `);
      userMarker.openPopup();
      markers.push(userMarker);

      // Add a visual proximity circle around user
      L.circle([userCoords.latitude, userCoords.longitude], {
        color: '#0d9488',
        fillColor: '#14b8a6',
        fillOpacity: 0.1,
        radius: 25000 // 25km radius
      }).addTo(map);
    }

    // 2. Add Hospital & Doctor Markers
    doctors.forEach(doc => {
      const hosp = hospitals.find(h => h.id === doc.hospitalId);
      const lat = doc.latitude || hosp?.latitude;
      const lng = doc.longitude || hosp?.longitude;

      if (lat && lng) {
        const docIcon = createCustomIcon('#2563eb', '👨‍⚕️');
        const marker = L.marker([lat, lng], { icon: docIcon }).addTo(map);
        
        const popupContent = document.createElement('div');
        popupContent.style.fontFamily = 'sans-serif';
        popupContent.style.fontSize = '12px';
        popupContent.style.padding = '4px';
        popupContent.innerHTML = `
          <strong style="color: #1e293b; font-size: 13px; display: block;">${doc.name}</strong>
          <span style="color: #0d9488; font-weight: 600; font-size: 11px;">${doc.specialty}</span>
          <p style="color: #64748b; margin: 4px 0 6px 0; font-size: 11px;">${hosp ? hosp.name : doc.city} &bull; ${doc.city}</p>
          <button id="book-btn-${doc.id}" style="
            background: #0d9488;
            color: white;
            border: none;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
          ">View Details & Book</button>
        `;

        // Handle button click in popup
        marker.bindPopup(popupContent);
        marker.on('popupopen', () => {
          const btn = document.getElementById(`book-btn-${doc.id}`);
          if (btn) {
            btn.onclick = () => onSelectDoctor(doc);
          }
        });

        markers.push(marker);
      }
    });

    // Auto-fit bounds if we have multiple points
    if (markers.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userCoords, userAddress, doctors, hospitals, onSelectDoctor]);

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-sm flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <span className="h-3 w-3 rounded-full bg-blue-600 inline-block"></span>
          <span>Doctor / Facility</span>
        </div>
      </div>
    </div>
  );
};
