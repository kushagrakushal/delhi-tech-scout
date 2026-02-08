import React, { useState, useEffect } from 'react';
import { exploreTechVenues } from '../services/gemini';
import { GroundingMetadata } from '../types';

export const VenueExplorer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>('');
  const [metadata, setMetadata] = useState<GroundingMetadata | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.log("Geolocation blocked or failed, using default Delhi center.");
          setLocationError("Location access denied. Showing general Delhi hubs.");
        }
      );
    }
  }, []);

  const handleExplore = async () => {
    setLoading(true);
    try {
      const result = await exploreTechVenues(location?.lat, location?.lng);
      setContent(result.text);
      setMetadata(result.groundingMetadata);
    } catch (error) {
      console.error(error);
      setContent("Unable to load map data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleExplore();
  }, [location]); 

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-extrabold text-white mb-3">Tech Hubs & Spaces</h2>
        <p className="text-slate-400 text-lg">Find the best spots for co-working and meetups near you.</p>
        {locationError && <p className="text-amber-400 text-sm mt-3 font-medium bg-amber-900/30 border border-amber-900/50 inline-block px-3 py-1 rounded-full">{locationError}</p>}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 bg-slate-900/50 backdrop-blur-md rounded-[2rem] shadow-sm border border-white/5">
           <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
           <p className="text-slate-400 font-medium">Scouting locations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Text Content */}
           <div className="lg:col-span-2">
              <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/5 h-full">
                <div className="prose prose-invert prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-slate-300 leading-relaxed">
                    {content}
                  </div>
                </div>
              </div>
           </div>

           {/* Sidebar with Map Links */}
           <div className="space-y-4">
              <h3 className="text-lg font-bold text-white px-2">Discovered Places</h3>
              {metadata?.groundingChunks?.map((chunk, i) => {
                 if (chunk.maps?.uri) {
                   return (
                     <div key={i} className="bg-slate-900/60 backdrop-blur-sm p-5 rounded-3xl shadow-lg border border-white/5 hover:border-indigo-500/50 transition-all group">
                        <h4 className="font-bold text-slate-200 mb-2">{chunk.maps.title}</h4>
                        {chunk.maps.placeAnswerSources?.[0]?.reviewSnippets?.[0] && (
                          <p className="text-sm text-slate-400 mb-4 italic pl-3 border-l-2 border-indigo-500/50">
                            "{chunk.maps.placeAnswerSources[0].reviewSnippets[0].snippet}"
                          </p>
                        )}
                        <a 
                          href={chunk.maps.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-slate-900 bg-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-50 transition-colors w-full justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          Open in Maps
                        </a>
                     </div>
                   );
                 }
                 return null;
              })}
              {(!metadata?.groundingChunks || metadata.groundingChunks.length === 0) && (
                <div className="text-slate-500 text-sm p-6 text-center border-2 border-dashed border-white/5 rounded-3xl">
                  No direct map coordinates found.
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};