"use client";

import dynamic from 'next/dynamic';

const MapDiscovery = dynamic(() => import('./MapDiscovery'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center border border-gray-200 rounded-md">
      <div className="text-gray-400 flex flex-col items-center">
        <svg className="animate-spin h-6 w-6 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span className="text-xs font-semibold uppercase tracking-widest">Loading Geospatial Data...</span>
      </div>
    </div>
  )
});

export default MapDiscovery;
