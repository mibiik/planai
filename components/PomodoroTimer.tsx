
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WorkSession } from '../types';
import { PlayIcon, PauseIcon, ArrowPathIcon, CogIcon, ArrowsPointingOutIcon, XMarkIcon, ArrowsPointingInIcon } from './icons';
import { useLocalStorage } from '../hooks/useLocalStorage';


interface PomodoroTimerProps {
    onSessionComplete: (session: Omit<WorkSession, 'id'>) => void;
}

type Mode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSettings {
    work: number;
    shortBreak: number;
    longBreak: number;
    longBreakInterval: number;
}

const defaultSettings: PomodoroSettings = {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
};

const MODE_LABELS: Record<Mode, string> = {
    work: 'Çalışma Zamanı',
    shortBreak: 'Kısa Mola',
    longBreak: 'Uzun Mola',
}

const SettingsPanel: React.FC<{
    settings: PomodoroSettings,
    onSave: (newSettings: PomodoroSettings) => void,
    onClose: () => void,
}> = ({ settings, onSave, onClose }) => {
    const [tempSettings, setTempSettings] = useState(settings);

    const handleSave = () => {
        onSave(tempSettings);
        onClose();
    };
    
    const handleReset = () => {
        setTempSettings(defaultSettings);
    }

    const handleChange = (field: keyof PomodoroSettings, value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue > 0) {
            setTempSettings(prev => ({...prev, [field]: numValue }));
        }
    };

    return (
        <div className="absolute inset-0 bg-slate-50 z-20 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg">Pomodoro Ayarları</h4>
                <button onClick={onClose}><XMarkIcon className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4 flex-grow">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Çalışma (dakika)</label>
                    <input type="number" value={tempSettings.work} onChange={e => handleChange('work', e.target.value)} className="w-full mt-1 p-2 border rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Kısa Mola (dakika)</label>
                    <input type="number" value={tempSettings.shortBreak} onChange={e => handleChange('shortBreak', e.target.value)} className="w-full mt-1 p-2 border rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Uzun Mola (dakika)</label>
                    <input type="number" value={tempSettings.longBreak} onChange={e => handleChange('longBreak', e.target.value)} className="w-full mt-1 p-2 border rounded-md"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Uzun Mola Aralığı</label>
                    <input type="number" value={tempSettings.longBreakInterval} onChange={e => handleChange('longBreakInterval', e.target.value)} className="w-full mt-1 p-2 border rounded-md"/>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={handleReset} className="w-full px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Varsayılana Sıfırla</button>
                <button onClick={handleSave} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Kaydet</button>
            </div>
        </div>
    );
};

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onSessionComplete }) => {
    const [settings, setSettings] = useLocalStorage<PomodoroSettings>('pomodoro-settings', defaultSettings);
    const [mode, setMode] = useState<Mode>('work');
    const [timeLeft, setTimeLeft] = useState(settings.work * 60);
    const [isActive, setIsActive] = useState(false);
    const [cycles, setCycles] = useState(0);
    const [sessionName, setSessionName] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const focusContainerRef = useRef<HTMLDivElement>(null);

    const getDurationForMode = useCallback((m: Mode) => settings[m] * 60, [settings]);

    const switchMode = useCallback(() => {
        setIsActive(false);
        if (mode === 'work') {
            onSessionComplete({ name: sessionName || 'İsimsiz Pomodoro', duration: getDurationForMode('work'), date: new Date(), type: 'Pomodoro' });
            const newCycles = cycles + 1;
            setCycles(newCycles);
            const nextMode = newCycles % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
            setMode(nextMode);
            setTimeLeft(getDurationForMode(nextMode));
        } else {
            setMode('work');
            setTimeLeft(getDurationForMode('work'));
        }
    }, [mode, cycles, sessionName, onSessionComplete, settings, getDurationForMode]);
    
    useEffect(() => {
        let interval: number | null = null;
        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            switchMode();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, switchMode]);
    
    useEffect(() => {
        if (!isActive) {
            setTimeLeft(getDurationForMode(mode));
        }
    }, [settings, mode, isActive, getDurationForMode]);
    
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFocusMode(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFocusMode = useCallback(() => {
        if (!document.fullscreenElement) {
            focusContainerRef.current?.requestFullscreen().catch(err => {
                alert(`Tam ekran modu etkinleştirilemedi: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);


    const handleToggle = () => setIsActive(!isActive);

    const handleReset = () => {
        setIsActive(false);
        setMode('work');
        setTimeLeft(getDurationForMode('work'));
        setCycles(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    const duration = getDurationForMode(mode);
    const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

    return (
        <div ref={focusContainerRef} className={`relative ${isFocusMode ? 'bg-slate-900 w-full h-full flex flex-col items-center justify-center' : ''}`}>
            
            {!isFocusMode ? (
                <div className="flex justify-end gap-2 absolute -top-4 right-0">
                     <button onClick={toggleFocusMode} className="p-2 text-slate-500 hover:text-slate-800 transition-colors" title="Odak Modu">
                        <ArrowsPointingOutIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-500 hover:text-slate-800 transition-colors" title="Ayarlar">
                        <CogIcon className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <button onClick={toggleFocusMode} className="absolute top-6 right-6 text-white/50 hover:text-white" title="Odak Modundan Çık">
                    <ArrowsPointingInIcon className="w-8 h-8"/>
                </button>
            )}

            <div className={`flex flex-col items-center text-center space-y-6 ${isFocusMode ? 'text-white' : 'text-slate-700'}`}>
                <h3 className={`text-xl font-semibold`}>{MODE_LABELS[mode]}</h3>

                <div className={`relative ${isFocusMode ? 'w-80 h-80' : 'w-48 h-48'}`}>
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle className={isFocusMode ? 'text-white/20' : 'text-slate-200'} strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                        <circle
                            className={isFocusMode ? 'text-white' : 'text-indigo-600'}
                            strokeWidth="10"
                            strokeDasharray={2 * Math.PI * 45}
                            strokeDashoffset={(2 * Math.PI * 45) - (progress / 100) * (2 * Math.PI * 45)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="45"
                            cx="50"
                            cy="50"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s linear' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`font-bold ${isFocusMode ? 'text-8xl' : 'text-5xl text-slate-800'}`}>{formatTime(timeLeft)}</span>
                    </div>
                </div>

                {!isFocusMode && (
                    <div className="w-full">
                        <label htmlFor="sessionName" className="block text-sm font-medium text-slate-700 mb-1 text-left">Oturum Adı (Opsiyonel)</label>
                        <input
                            type="text"
                            id="sessionName"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            placeholder="Ne üzerinde çalışıyorsun?"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button onClick={handleToggle} className={`flex items-center justify-center text-white rounded-full shadow-lg transition-transform transform hover:scale-105 ${isFocusMode ? 'w-24 h-24 bg-white/20 hover:bg-white/30' : 'w-20 h-20 bg-indigo-600 hover:bg-indigo-700'}`}>
                        {isActive ? <PauseIcon className="w-12 h-12" /> : <PlayIcon className="w-12 h-12" />}
                    </button>
                    {!isFocusMode && <button onClick={handleReset} className="p-4 text-slate-500 hover:text-slate-800 transition-colors"><ArrowPathIcon className="w-6 h-6" /></button>}
                </div>
                
                <p className={`text-sm ${isFocusMode ? 'text-white/70' : 'text-slate-500'}`}>Tamamlanan döngüler: {cycles}</p>
            </div>
            
            {!isFocusMode && isSettingsOpen && <SettingsPanel settings={settings} onSave={setSettings} onClose={() => setIsSettingsOpen(false)} />}
        </div>
    );
};