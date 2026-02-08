import React from 'react';
import { TechEvent } from '../types';

interface EventCardProps {
  event: TechEvent;
  onClick: (event: TechEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const hasSwag = event.tags.some(tag => tag.toLowerCase().includes('swag') || tag.toLowerCase().includes('goodies'));
  
  // Determine source icon/label
  const isLinkedIn = event.sourceUrl?.toLowerCase().includes('linkedin');
  const isMeetup = event.sourceUrl?.toLowerCase().includes('meetup');
  const isLuma = event.sourceUrl?.toLowerCase().includes('lu.ma');
  const isInternshala = event.sourceUrl?.toLowerCase().includes('internshala');
  
  let sourceLabel = "View Event";
  if (isLinkedIn) sourceLabel = "LinkedIn";
  else if (isMeetup) sourceLabel = "Meetup";
  else if (isLuma) sourceLabel = "Luma";
  else if (isInternshala) sourceLabel = "Internshala";

  const handleSourceClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the modal when clicking the link
    if (event.sourceUrl) {
      window.open(event.sourceUrl, '_blank');
    }
  };

  return (
    <div 
      onClick={() => onClick(event)}
      className="group bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] border border-white/5 hover:border-indigo-500/30 transition-all duration-300 cursor-pointer flex flex-col h-full relative overflow-hidden transform hover:-translate-y-1"
    >
      {/* Decorative gradient blob on hover */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-slate-800 text-slate-300 border-white/5">
            {event.date}
          </span>
          {hasSwag && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm shadow-pink-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
              </svg>
              Goodies
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-indigo-400 transition-colors">
          {event.title}
        </h3>

        <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{event.location}</span>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed mb-4 line-clamp-3">
          {event.description}
        </p>
        
        {/* Tags Display */}
        {event.tags && event.tags.length > 0 && (
          <div className="mb-5 relative">
             <style>{`
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .no-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
             `}</style>
             <div className={`flex gap-2 w-full ${event.tags.length > 3 ? 'overflow-x-auto no-scrollbar mask-gradient pr-2' : 'flex-wrap'}`}>
               {event.tags.map((tag, i) => (
                 <span 
                   key={i} 
                   className="whitespace-nowrap px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wide bg-white/5 text-slate-400 border border-white/5 group-hover:border-white/10 transition-colors"
                 >
                   #{tag}
                 </span>
               ))}
             </div>
             {/* Fade effect for scrolling */}
             {event.tags.length > 3 && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900/10 to-transparent pointer-events-none group-hover:from-transparent transition-all"></div>
             )}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Cost Logic */}
            {(event.cost === 'Free' || event.cost === 'free') ? (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-2.5 py-1 rounded-lg">Free</span>
            ) : (
              <span className="text-xs font-semibold text-amber-400 bg-amber-950/30 border border-amber-900/50 px-2.5 py-1 rounded-lg">Paid</span>
            )}
            
            {event.hasCertificate && (
               <span className="text-xs font-semibold text-blue-400 bg-blue-950/30 border border-blue-900/50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                 Certificate
               </span>
            )}
          </div>
          
          <div className="flex gap-2">
            {event.sourceUrl && (
              <button 
                onClick={handleSourceClick}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                  isLinkedIn ? 'bg-[#0077b5] text-white hover:bg-[#006097]' : 
                  isMeetup ? 'bg-[#f64060] text-white hover:bg-[#d63050]' :
                  isInternshala ? 'bg-[#1295c9] text-white hover:bg-[#0e7aa6]' :
                  'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
                title={`View on ${sourceLabel}`}
              >
                {isLinkedIn ? (
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                   </svg>
                )}
              </button>
            )}

            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};