"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Next.js/Webpack
/* eslint-disable @typescript-eslint/no-explicit-any */
delete (L.Icon.Default.prototype as any)._getIconUrl;
/* eslint-enable @typescript-eslint/no-explicit-any */
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Hotel {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface MapDiscoveryProps {
  targetLocation: [number, number]; // [lat, lng]
  radiusKm: number;
  nearbyHotels: Hotel[];
  selectedCompetitors: string[];
  onToggleCompetitor: (name: string) => void;
}

export default function MapDiscovery({
  targetLocation,
  radiusKm,
  nearbyHotels,
  selectedCompetitors,
  onToggleCompetitor
}: MapDiscoveryProps) {
  
  // Calculate distance in km between two lat/lngs
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="h-full w-full rounded-md overflow-hidden relative border border-gray-200 shadow-inner z-0">
      <MapContainer 
        center={targetLocation} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Target Hotel Marker */}
        <Marker position={targetLocation} icon={redIcon}>
          <Popup>
            <strong>Target Property</strong><br/>
            (Center of Search Radius)
          </Popup>
        </Marker>

        {/* Radius Circle */}
        <Circle 
          center={targetLocation} 
          radius={radiusKm * 1000} // meters
          pathOptions={{ color: 'black', fillColor: 'black', fillOpacity: 0.05, weight: 1 }}
        />

        {/* Nearby Hotels */}
        {nearbyHotels.map((hotel) => {
          const distance = getDistance(targetLocation[0], targetLocation[1], hotel.lat, hotel.lng);
          const isSelected = selectedCompetitors.includes(hotel.name);
          const inRadius = distance <= radiusKm;
          
          return (
            <Marker 
              key={hotel.id} 
              position={[hotel.lat, hotel.lng]}
              opacity={inRadius ? 1 : 0.4}
            >
              <Popup>
                <div className="text-center min-w-[120px]">
                  <strong className="block text-gray-800">{hotel.name}</strong>
                  <span className="text-xs text-gray-500">{distance.toFixed(1)} km away</span>
                  
                  <div className="mt-2">
                    {inRadius ? (
                      <button
                        onClick={() => onToggleCompetitor(hotel.name)}
                        className={`text-xs font-bold px-3 py-1 rounded w-full transition-colors ${
                          isSelected ? "bg-black text-white hover:bg-red-600" : "bg-gray-200 text-gray-700 hover:bg-black hover:text-white"
                        }`}
                      >
                        {isSelected ? "Remove from Set" : "Add to Comp Set"}
                      </button>
                    ) : (
                      <div className="text-[10px] uppercase font-bold text-red-500 bg-red-50 py-1 rounded border border-red-100">
                        Outside Radius
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
