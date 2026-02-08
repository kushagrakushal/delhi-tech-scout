import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { searchTechEvents, getEventDetails } from '../services/gemini';
import { TechEvent, GroundingMetadata } from '../types';
import { EventCard } from './EventCard';

// --- Markdown Parsing Helper Components ---

const parseInline = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>;
    }
    const linkParts = part.split(/(\[[^\]]+\]\([^\)]+\))/g);
    return linkParts.map((subPart, j) => {
       const linkMatch = subPart.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
       if (linkMatch) {
           let url = linkMatch[2].trim();
           if (!url.startsWith('http') && !url.startsWith('mailto:')) url = `https://${url}`;
           return (
               <a key={`${i}-${j}`} href={url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/30 hover:decoration-indigo-400 transition-colors font-medium break-words">
                   {linkMatch[1]}
               </a>
           );
       }
       const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|org|net|io|co|in|edu|gov|dev|ai|app|xyz)(?:\/[^\s]*)?)/g;
       const urlParts = subPart.split(urlRegex);
       return urlParts.map((uPart, k) => {
          if (uPart.match(urlRegex)) {
              let url = uPart.trim();
              const trailing = url.match(/[.,;:)]+$/);
              let suffix = "";
              if (trailing) { suffix = trailing[0]; url = url.slice(0, -suffix.length); }
              let href = url;
              if (!href.startsWith('http') && !href.startsWith('mailto:')) href = `https://${href}`;
              return (
                 <React.Fragment key={`${i}-${j}-${k}`}>
                   <a href={href} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 break-all hover:underline decoration-indigo-400/30">{url}</a>
                   {suffix}
                 </React.Fragment>
              );
          }
          return uPart;
       });
    });
  }).flat();
};

const MarkdownView: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-2" />;
        if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold text-slate-200 mt-6 mb-2 tracking-tight">{parseInline(line.replace('### ', ''))}</h3>;
        if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-slate-100 mt-8 mb-3 border-b border-white/10 pb-2 flex items-center gap-2">{parseInline(line.replace('## ', ''))}</h2>;
        if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-bold text-white mt-4 mb-4">{parseInline(line.replace('# ', ''))}</h1>;
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={index} className="flex gap-2.5 mb-2 ml-1">
               <span className="text-indigo-400 mt-1.5">•</span>
               <div className="text-slate-300 leading-relaxed flex-1">{parseInline(trimmed.replace(/^[\-\*]\s+/, ''))}</div>
            </div>
          );
        }
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
           return (
            <div key={index} className="flex gap-3 mb-3 ml-1">
               <span className="flex-shrink-0 bg-indigo-500/10 text-indigo-400 font-bold text-xs h-6 w-6 rounded-full flex items-center justify-center mt-0.5 border border-indigo-500/20">{numMatch[1]}</span>
               <div className="text-slate-300 leading-relaxed flex-1 pt-0.5">{parseInline(numMatch[2])}</div>
            </div>
          );
        }
        return <p key={index} className="text-slate-300 leading-relaxed mb-2">{parseInline(line)}</p>;
      })}
    </div>
  );
};

// --- Main Component ---

export const EventFeed: React.FC = () => {
  const [events, setEvents] = useState<TechEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<GroundingMetadata | null>(null);
  const [rawText, setRawText] = useState<string>('');

  // Filter States
  const [costFilter, setCostFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [certificateFilter, setCertificateFilter] = useState<boolean>(false);

  // Modal & Details Cache
  const [selectedEvent, setSelectedEvent] = useState<TechEvent | null>(null);
  const [details, setDetails] = useState<string>('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsCache, setDetailsCache] = useState<Record<string, string>>({});

  // --- ROBUST CACHING LOGIC ---
  const loadEvents = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // Helper: Safely get cache
    const getCachedData = () => {
      try {
        const data = localStorage.getItem('delhiEventsData');
        return data ? JSON.parse(data) : null;
      } catch (e) { return null; }
    };

    const cached = getCachedData();
    const cachedTime = localStorage.getItem('delhiEventsTime');
    // Check if cache is fresh (less than 24 hours old)
    const isFresh = cachedTime && (Date.now() - parseInt(cachedTime) < 24 * 60 * 60 * 1000);

    // STRATEGY 1: Use Fresh Cache (Fastest, 0 Cost)
    if (!forceRefresh && cached && isFresh) {
      console.log("Using fresh cache (Quota Saved).");
      setEvents(cached.events);
      setMetadata(cached.groundingMetadata);
      setRawText(cached.rawText);
      setLoading(false);
      return;
    }

    // STRATEGY 2: Fetch from API
    try {
      console.log("Fetching fresh events from Gemini...");
      const data = await searchTechEvents();
      
      // Success: Update State & Cache
      setEvents(data.events);
      setMetadata(data.groundingMetadata);
      setRawText(data.rawText);
      
      localStorage.setItem('delhiEventsData', JSON.stringify(data));
      localStorage.setItem('delhiEventsTime', Date.now().toString());

    } catch (err: any) {
      console.error("API Error:", err);
      
      // STRATEGY 3: Fallback to Stale Cache (Robustness)
      if (cached) {
         console.warn("API failed, using stale cache fallback.");
         setEvents(cached.events);
         setMetadata(cached.groundingMetadata);
         setRawText(cached.rawText);
         
         if (err.message?.includes('429') || err.status === 429) {
            setError("Traffic is high (Rate Limit). Showing saved events.");
         } else {
            setError("Network issue. Showing saved events.");
         }
      } else {
         // No cache + API failed = Show Error
         if (err.message?.includes('429') || err.status === 429) {
            setError("Server is busy (Rate Limit). Please try again in a minute.");
         } else {
            setError("Failed to load events. Please check your connection.");
         }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents(); 
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (costFilter !== 'all') {
        const eventCost = event.cost?.toLowerCase() || 'unknown';
        if (costFilter === 'free' && !eventCost.includes('free')) return false;
        if (costFilter === 'paid' && !eventCost.includes('paid')) return false;
      }
      if (certificateFilter && !event.hasCertificate) return false;
      return true;
    });
  }, [events, costFilter, certificateFilter]);

  const handleCardClick = async (event: TechEvent) => {
    setSelectedEvent(event);
    if (detailsCache[event.id]) {
        setDetails(detailsCache[event.id]);
        setDetailsLoading(false);
        return;
    }
    setDetails('');
    setDetailsLoading(true);
    try {
      const result = await getEventDetails(event.title, event.description);
      setDetails(result);
      setDetailsCache(prev => ({ ...prev, [event.id]: result }));
    } catch (e) {
      setDetails("Could not retrieve details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => setSelectedEvent(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 relative">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Discover Events</h2>
          <p className="text-slate-400 text-lg">Curated tech gatherings, workshops & meetups in Delhi.</p>
        </div>
        <button 
          onClick={() => loadEvents(true)}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-indigo-900/50 transition-all active:scale-95 flex items-center gap-2"
        >
          {loading ? 'Scanning...' : 'Refresh Events'}
        </button>
      </div>

      {error && (
        <div className={`mb-8 p-4 rounded-xl border ${error.includes('Rate Limit') ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200' : 'bg-red-500/10 border-red-500/20 text-red-200'}`}>
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900/40 backdrop-blur-sm rounded-3xl h-80 shadow-sm border border-white/5 animate-pulse p-6">
                <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-slate-800 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-800 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-800 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} onClick={handleCardClick} />
        ))}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"></div>
          <div className="bg-slate-900 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col relative z-10 transform transition-all animate-in fade-in zoom-in-95 duration-200 border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-start bg-slate-900/90 backdrop-blur sticky top-0 z-20">
              <div className="pr-8">
                <h3 className="text-2xl font-extrabold text-white mb-2 leading-tight">{selectedEvent.title}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-lg border border-indigo-500/20">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     {selectedEvent.date}
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-white/5">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     {selectedEvent.location}
                  </div>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-900 custom-scrollbar">
              {detailsLoading ? (
                <div className="space-y-6">
                   <div className="p-5 bg-slate-800/50 rounded-2xl border border-white/5 mb-8">
                     <p className="text-slate-300 italic leading-relaxed">{selectedEvent.description}</p>
                   </div>
                   <div className="space-y-4 animate-pulse">
                      <div className="h-6 bg-slate-800 rounded w-1/3"></div>
                      <div className="space-y-2"><div className="h-4 bg-slate-800 rounded w-full"></div><div className="h-4 bg-slate-800 rounded w-5/6"></div></div>
                      <div className="h-6 bg-slate-800 rounded w-1/4 mt-8"></div>
                      <div className="space-y-2"><div className="h-4 bg-slate-800 rounded w-full"></div><div className="h-4 bg-slate-800 rounded w-full"></div></div>
                      <div className="flex items-center justify-center mt-8"><span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase animate-pulse">AI is compiling details...</span></div>
                   </div>
                </div>
              ) : (
                <>{details ? <MarkdownView content={details} /> : <p className="text-slate-500 italic">No additional details available.</p>}</>
              )}
            </div>
            <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-between items-center">
               <div className="text-xs text-slate-500 font-medium">AI Generated Content</div>
               <div className="flex gap-3">
                 {selectedEvent.sourceUrl && (
                   <a href={selectedEvent.sourceUrl} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-xl shadow-lg shadow-white/10 transition-all active:scale-95 flex items-center gap-2">
                     Official Page
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>
                   </a>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};