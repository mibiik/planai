
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { WorkSession } from '../types';
import { PlayIcon, PauseIcon, ArrowPathIcon, SparklesIcon } from './icons';


interface SmartFocusProps {
    onSaveSession: (session: Omit<WorkSession, 'id'>) => void;
}

interface FocusPlan {
    steps: string[];
    duration: number;
}

export const SmartFocus: React.FC<SmartFocusProps> = ({ onSaveSession }) => {

    const [goal, setGoal] = useState('');
    const [plan, setPlan] = useState<FocusPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    

    useEffect(() => {
        let interval: number | null = null;
        if (isTimerActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isTimerActive && timeLeft === 0) {
            setIsTimerActive(false);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerActive, timeLeft]);

    const handleGeneratePlan = async () => {
        if (!goal.trim()) {
            setError('Lütfen bir hedef girin.');
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Bir kullanıcı bu hedefi gerçekleştirmek istiyor: "${goal}". Bu hedefi tamamlamak için 3 ila 5 somut, eyleme dönüştürülebilir adıma ayır. Ayrıca, bu hedefin tamamlanması için gereken toplam süreyi dakika cinsinden tahmin et (örneğin, 60, 75, 90). Yanıtını JSON formatında ver.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            steps: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: 'Hedefi tamamlamak için eyleme dönüştürülebilir adımlar.'
                            },
                            duration: {
                                type: Type.INTEGER,
                                description: 'Görevi tamamlamak için önerilen toplam süre (dakika cinsinden).'
                            }
                        },
                        required: ["steps", "duration"]
                    }
                }
            });

            const jsonString = response.text;
            const parsedPlan: FocusPlan = JSON.parse(jsonString);
            
            if (!parsedPlan.steps || !parsedPlan.duration || parsedPlan.steps.length === 0 || parsedPlan.duration <= 0) {
                throw new Error("Yapay zeka geçersiz bir plan oluşturdu.");
            }
            
            setPlan(parsedPlan);
            setTimeLeft(parsedPlan.duration * 60);

        } catch (e) {
            console.error(e);
            setError("Odaklanma planı oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
            setPlan(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleToggleTimer = () => setIsTimerActive(prev => !prev);

    const handleStepToggle = (index: number) => {
        setCompletedSteps(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleReset = () => {
        setGoal('');
        setPlan(null);
        setIsLoading(false);
        setError(null);
        setTimeLeft(0);
        setIsTimerActive(false);
        setCompletedSteps([]);
    };
    
    const handleSave = () => {
        if (!plan) return;
        const totalDurationSeconds = plan.duration * 60;
        
        onSaveSession({
            name: goal,
            duration: totalDurationSeconds,
            date: new Date(),
            type: 'Akıllı Odaklanma'
        });
        handleReset();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-center space-y-4 h-full">
                <SparklesIcon className="w-12 h-12 text-indigo-500 animate-pulse" />
                <p className="text-slate-600 font-semibold">Akıllı planınız oluşturuluyor...</p>
                <p className="text-sm text-slate-500">Lütfen bekleyin, Gemini sizin için en iyi adımları hazırlıyor.</p>
            </div>
        );
    }
    
    if (plan) {
        return (
             <div className="flex flex-col items-center text-center space-y-6">
                <h3 className="text-xl font-semibold text-slate-700">Akıllı Odaklanma Oturumu</h3>
                
                <p className="text-slate-600 px-4">"{goal}" hedefine odaklanılıyor</p>

                <div className="text-6xl font-mono font-bold text-slate-800 tracking-wider">
                    {formatTime(timeLeft)}
                </div>
                 
                <div className="flex items-center gap-4">
                    <button onClick={handleToggleTimer} className="flex items-center justify-center w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105">
                        {isTimerActive ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
                    </button>
                    <button onClick={handleReset} className="p-4 text-slate-500 hover:text-slate-800 transition-colors" title="Oturumu İptal Et">
                        <ArrowPathIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="w-full text-left space-y-3 bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-slate-800">Görev Listeniz</h4>
                    {plan.steps.map((step, index) => (
                        <div key={index} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`step-${index}`}
                                checked={completedSteps.includes(index)}
                                onChange={() => handleStepToggle(index)}
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <label htmlFor={`step-${index}`} className={`ml-3 text-sm text-slate-700 cursor-pointer ${completedSteps.includes(index) ? 'line-through text-slate-400' : ''}`}>
                                {step}
                            </label>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleSave}
                    disabled={isTimerActive && timeLeft > 0}
                    className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors shadow disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                    Oturumu Tamamla ve Kaydet
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex items-center gap-2 text-xl font-semibold text-slate-700">
                <SparklesIcon className="w-6 h-6 text-indigo-500" />
                <h3>Akıllı Odaklanma</h3>
            </div>
            <p className="text-sm text-slate-600">Bir hedef belirleyin, Gemini sizin için bir çalışma planı oluştursun.</p>
            
            <div className="w-full">
                <label htmlFor="goal" className="block text-sm font-medium text-slate-700 mb-1 text-left">Bugünkü Hedefiniz Nedir?</label>
                <textarea
                    id="goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    rows={3}
                    placeholder="Örn: Aylık satış raporunu hazırla"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            
            {error && <p className="text-sm text-red-500">{error}</p>}
            
            <button
                onClick={handleGeneratePlan}
                disabled={!goal.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
                <SparklesIcon className="w-5 h-5"/>
                Plan Oluştur
            </button>
        </div>
    );
};