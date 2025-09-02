import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SchedulerEvent, CATEGORIES } from '../types';
import { XMarkIcon, SparklesIcon } from './icons';
import { formatTime } from '../utils/dateUtils';

interface DailyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  eventsForDay: SchedulerEvent[];
  onEventSelect: (event: SchedulerEvent) => void;
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({ isOpen, onClose, currentDate, eventsForDay, onEventSelect }) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      generateBriefing();
    }
  }, [isOpen, currentDate, eventsForDay]);

  const generateBriefing = async () => {
    if (eventsForDay.length === 0) {
      setSummary("Bugün için planlanmış bir etkinliğiniz yok. Harika bir gün geçirin!");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const eventsString = eventsForDay
        .sort((a,b) => a.start.getTime() - b.start.getTime())
        .map(e => `- "${e.title}" (${formatTime(e.start)} - ${formatTime(e.end)}), Kategori: ${CATEGORIES[e.category].name}`)
        .join('\n');

    const prompt = `Sen yardımsever ve motive edici bir kişisel asistansın. Kullanıcının ${currentDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} tarihli programı aşağıdadır. Lütfen günü özetleyen, arkadaşça bir selamlama ile başlayan kısa bir brifing hazırla. Önemli olayları vurgula ve programın yoğunluğuna göre bir yorum yap. Cevabını başlıklar, listeler ve kalın metin gibi Markdown formatını kullanarak yapılandır.\n\nBugünün Programı:\n${eventsString}`;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        // A simple markdown to HTML converter
        let htmlSummary = response.text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\n/g, '<br />'); // Newlines
        
        setSummary(htmlSummary);

    } catch (e) {
        console.error("Error generating daily briefing:", e);
        setError("Özet oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleEventClick = (event: SchedulerEvent) => {
    onEventSelect(event);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] transform transition-all animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-indigo-500" />
            Günün Özeti
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors">
            <XMarkIcon />
          </button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-center space-y-3 h-32">
                <SparklesIcon className="w-10 h-10 text-indigo-500 animate-pulse" />
                <p className="text-slate-600 font-semibold">Özetiniz hazırlanıyor...</p>
            </div>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : (
             <>
              <div className="prose prose-slate max-w-none mb-6" dangerouslySetInnerHTML={{ __html: summary }}></div>
              
              {eventsForDay.length > 0 && (
                <>
                  <div className="border-t border-slate-200 -mx-6 my-4"></div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Bugünün Etkinlikleri</h3>
                  <ul className="space-y-2">
                    {eventsForDay
                      .sort((a,b) => a.start.getTime() - b.start.getTime())
                      .map(event => {
                      const categoryStyle = CATEGORIES[event.category] || CATEGORIES.other;
                      return (
                        <li 
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors hover:bg-slate-100 border-l-4 ${categoryStyle.border}`}
                        >
                          <div className="flex-grow">
                            <p className={`font-semibold ${categoryStyle.text} ${event.completed ? 'line-through text-slate-400' : ''}`}>
                              {event.title}
                            </p>
                            <p className={`text-sm ${event.completed ? 'text-slate-400 line-through' : 'text-slate-500'}`}>
                              {formatTime(event.start)} - {formatTime(event.end)}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${categoryStyle.bg} ${categoryStyle.text}`}>
                            {categoryStyle.name}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end p-4 bg-slate-50 rounded-b-lg flex-shrink-0">
             <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md">Kapat</button>
        </div>
      </div>
    </div>
  );
};