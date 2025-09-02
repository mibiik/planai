import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { XMarkIcon, SparklesIcon } from './icons';
import { Category } from '../types';

interface ParsedEventData {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  category: Category;
}

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventParsed: (data: ParsedEventData) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, onEventParsed }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    const today = new Date().toLocaleDateString('tr-TR');
    const categoriesList = "'work', 'personal', 'fitness', 'meeting', 'education', 'other'";
    const prompt = `Kullanıcı doğal dilde bir etkinlik girişi yaptı: "${text}". Bu metinden 'title', 'startDate' (YYYY-MM-DD formatında), 'startTime' (HH:mm formatında), 'endDate' (YYYY-MM-DD formatında) ve 'endTime' (HH:mm formatında) bilgilerini çıkar. Ayrıca, metnin içeriğine göre en uygun 'category' değerini şu listeden seç: ${categoriesList}. Eğer bitiş zamanı belirtilmemişse, başlangıç zamanından bir saat sonrasını varsay. Bugünün tarihi: ${today}. Cevabını sadece ve sadece JSON formatında ver.`;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "Etkinliğin başlığı." },
                        startDate: { type: Type.STRING, description: "Başlangıç tarihi (YYYY-MM-DD)." },
                        startTime: { type: Type.STRING, description: "Başlangıç saati (HH:mm)." },
                        endDate: { type: Type.STRING, description: "Bitiş tarihi (YYYY-MM-DD)." },
                        endTime: { type: Type.STRING, description: "Bitiş saati (HH:mm)." },
                        category: { type: Type.STRING, description: `Etkinliğin kategorisi, şunlardan biri: ${categoriesList}` },
                    },
                    required: ["title", "startDate", "startTime", "endDate", "endTime", "category"]
                }
            }
        });

        const parsedData = JSON.parse(response.text);
        onEventParsed(parsedData);

    } catch (e) {
        console.error("Error parsing event:", e);
        setError("Etkinlik anlaşılamadı. Lütfen daha belirgin bir şekilde tekrar yazın veya manuel ekleyin.");
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            Akıllı Ekle
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleParse} className="p-4 sm:p-6">
          <label htmlFor="quick-add-text" className="block text-sm font-medium text-gray-700 mb-2">
            Etkinliğinizi doğal bir dilde yazın:
          </label>
          <textarea
            id="quick-add-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Örn: Çarşamba 15:00'te proje toplantısı"
            disabled={isLoading}
          />
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          
          <div className="flex flex-col sm:flex-row justify-end pt-4 mt-4 gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isLoading} 
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !text.trim()} 
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm sm:text-base">Oluşturuluyor...</span>
                </>
              ) : (
                <span className="text-sm sm:text-base">Etkinlik Oluştur</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};