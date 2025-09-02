import React, { useState } from 'react';
import { SparklesIcon } from './icons';

interface ScheduleInputBarProps {
    onSchedule: (text: string) => void;
}

export const ScheduleInputBar: React.FC<ScheduleInputBarProps> = ({ onSchedule }) => {
    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (text.trim()) {
            onSchedule(text);
            setText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.currentTarget;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
    };

    return (
        <div className="relative">
            <div className="flex items-start gap-2">
                <div className="flex-1 relative">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onInput={handleInput}
                        rows={1}
                        placeholder="Programınızı yazarak planlayın..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none overflow-hidden bg-white text-sm placeholder-gray-400"
                    />
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!text.trim()}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    aria-label="Yazdığınız metinden takvimi planla"
                >
                    <SparklesIcon className="w-4 h-4" />
                    <span>Planla</span>
                </button>
            </div>
        </div>
    );
};
