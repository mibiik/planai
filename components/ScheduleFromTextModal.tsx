import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { XMarkIcon, SparklesIcon, DocumentTextIcon, ArrowPathIcon } from './icons';
import { Category, CATEGORIES } from '../types';

type ParsedEvent = {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  category: Category;
};

interface ScheduleFromTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvents: (events: ParsedEvent[]) => void;
  initialText: string;
}

export const ScheduleFromTextModal: React.FC<ScheduleFromTextModalProps> = ({ isOpen, onClose, onAddEvents, initialText }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedEvents, setParsedEvents] = useState<ParsedEvent[]>([]);
  const [view, setView] = useState<'input' | 'confirm'>('input');
  const hasParsedRef = useRef(false);
  
  const resetState = () => {
    setText('');
    setIsLoading(false);
    setError(null);
    setParsedEvents([]);
    setView('input');
    hasParsedRef.current = false;
  };
  
  const handleClose = () => {
    onClose();
    // Use a timeout to reset state after the closing animation is complete
    setTimeout(resetState, 300);
  };

  const handleParse = async (textToParse: string) => {
    if (!textToParse.trim()) return;

    setIsLoading(true);
    setError(null);

    const today = new Date().toLocaleDateString('tr-TR');
    const categoriesList = "'work', 'personal', 'fitness', 'meeting', 'education', 'other'";
    const prompt = `Kullanıcı doğal dilde bir program metni verdi: "${textToParse}". Bu metni analiz et ve içindeki tüm takvim etkinliklerini çıkar. Her etkinlik için 'title', 'startDate' (YYYY-MM-DD), 'startTime' (HH:mm), 'endDate' (YYYY-MM-DD), 'endTime' (HH:mm) ve 'category' (içerik için en uygun olanı şu listeden seç: ${categoriesList}) bilgilerini içeren bir JSON dizisi oluştur. Bitiş zamanı belirtilmemişse başlangıçtan 1 saat sonrası olarak ayarla. 'Tüm gün' gibi ifadeleri sabah 9'dan akşam 5'e kadar olarak yorumla. Bugünün tarihi: ${today}. Yanıtını SADECE JSON formatında bir dizi olarak ver.`;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            startDate: { type: Type.STRING },
                            startTime: { type: Type.STRING },
                            endDate: { type: Type.STRING },
                            endTime: { type: Type.STRING },
                            category: { type: Type.STRING },
                        },
                        required: ["title", "startDate", "startTime", "endDate", "endTime", "category"]
                    }
                }
            }
        });

        const parsedData: ParsedEvent[] = JSON.parse(response.text);
        if (parsedData.length === 0) {
            setError("Metinde eklenecek geçerli bir etkinlik bulunamadı.");
            setView('input');
            return;
        }
        setParsedEvents(parsedData);
        setView('confirm');

    } catch (e) {
        console.error("Error parsing schedule:", e);
        setError("Program anlaşılamadı. Lütfen metni daha net yazmayı deneyin veya etkinlikleri manuel olarak ekleyin.");
        setView('input');
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && initialText && !hasParsedRef.current) {
      hasParsedRef.current = true;
      setText(initialText);
      handleParse(initialText);
    }
  }, [isOpen, initialText]);
  
  const handleConfirm = () => {
    onAddEvents(parsedEvents);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-all animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-indigo-500" />
            Metinden Program Oluştur
          </h2>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-800 transition-colors">
            <XMarkIcon />
          </button>
        </div>

        {(isLoading && view === 'input') ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 h-64">
                <SparklesIcon className="w-12 h-12 text-indigo-500 animate-pulse" />
                <p className="text-slate-600 font-semibold">Programınız analiz ediliyor...</p>
                <p className="text-sm text-slate-500">Gemini etkinlikleri çıkarıyor, lütfen bekleyin.</p>
            </div>
        ) : view === 'input' ? (
          <div className="p-6">
            <label htmlFor="schedule-text" className="block text-sm font-medium text-slate-700 mb-2">
              Programınızı bir paragraf halinde yazın veya yapıştırın:
            </label>
            <textarea
              id="schedule-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              placeholder="Örn: Salı 10:00'da Pazarlama Sunumu. Cuma 15:00'te Dişçi Randevusu..."
              disabled={isLoading}
            />
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            <div className="flex justify-end pt-4 mt-2">
              <button type="button" onClick={handleClose} disabled={isLoading} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors mr-2 disabled:opacity-50">
                  İptal
              </button>
              <button type="button" onClick={() => handleParse(text)} disabled={isLoading || !text.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center disabled:bg-indigo-300 disabled:cursor-not-allowed w-48">
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analiz Ediliyor...
                  </>
                ) : 'Etkinlikleri Oluştur'}
              </button>
            </div>
          </div>
        ) : ( // Confirm view
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Bulunan Etkinlikler</h3>
            <p className="text-sm text-slate-600 mb-4">Aşağıdaki etkinlikler takviminize eklenecektir. Lütfen kontrol edin.</p>
            <div className="max-h-80 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-md border">
              {parsedEvents.map((event, index) => {
                 const categoryStyle = CATEGORIES[event.category] || CATEGORIES.other;
                 return (
                    <div key={index} className="p-3 bg-white rounded-md shadow-sm">
                        <div className="flex justify-between items-start">
                            <p className="font-semibold text-indigo-800">{event.title}</p>
                             <span className={`${categoryStyle.bg} ${categoryStyle.text} text-xs font-semibold px-2 py-1 rounded-full`}>
                                {categoryStyle.name}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                            {new Date(event.startDate + 'T' + event.startTime).toLocaleString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-4 mt-2">
              <button onClick={() => setView('input')} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
                <ArrowPathIcon className="w-5 h-5"/>
                <span>Tekrar Dene</span>
              </button>
              <button onClick={handleConfirm} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-md">
                Tümünü Takvime Ekle ({parsedEvents.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};