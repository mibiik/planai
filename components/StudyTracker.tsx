import React, { useState, useMemo } from 'react';
import { StudySubject, StudyResource, StudyTopic, TopicStatus, TOPIC_STATUSES } from '../types';
import { PlusIcon, TrashIcon, BookOpenIcon, XMarkIcon, Bars3Icon } from './icons';

interface StudyTrackerProps {
    subjects: StudySubject[];
    onSubjectsChange: (subjects: StudySubject[]) => void;
    onScheduleStudySession: (subject: StudySubject, topic: StudyTopic) => void;
}


const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    itemType: string;
}> = ({ isOpen, onClose, onConfirm, itemName, itemType }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all animate-fade-in-up">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Silme Onayı</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="mb-6">
                        <p className="text-gray-700 mb-2">
                            <span className="font-semibold">{itemName}</span> {itemType}ini silmek istediğinizden emin misiniz?
                        </p>
                        <p className="text-sm text-gray-500">
                            Bu işlem geri alınamaz.
                        </p>
                    </div>
                    
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
                        >
                            İptal
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                        >
                            Sil
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TopicStatusSelector: React.FC<{
    currentStatus: TopicStatus;
    onChange: (newStatus: TopicStatus) => void;
}> = ({ currentStatus, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const currentStyle = TOPIC_STATUSES[currentStatus];

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className={`px-2 py-1 text-xs font-semibold rounded-full w-28 text-left flex items-center justify-between ${currentStyle.bg} ${currentStyle.text}`}>
                <span>{currentStyle.name}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-32 bg-white rounded-md shadow-lg border">
                    {Object.entries(TOPIC_STATUSES).map(([key, { name, bg, text }]) => (
                        <button
                            key={key}
                            onClick={() => { onChange(key as TopicStatus); setIsOpen(false); }}
                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 ${key === currentStatus ? `${bg} ${text}` : ''}`}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const StudyTracker: React.FC<StudyTrackerProps> = ({ subjects, onSubjectsChange, onScheduleStudySession }) => {
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(subjects[0]?.id || null);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newResourceName, setNewResourceName] = useState('');
    const [newTopicName, setNewTopicName] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        itemName: string;
        itemType: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        itemName: '',
        itemType: '',
        onConfirm: () => {}
    });

    const selectedSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);

    const handleAddSubject = () => {
        if (!newSubjectName.trim()) return;
        const newSubject: StudySubject = {
            id: Date.now(),
            name: newSubjectName,
            resources: [],
            topics: [],
        };
        const updatedSubjects = [...subjects, newSubject];
        onSubjectsChange(updatedSubjects);
        setSelectedSubjectId(newSubject.id);
        setNewSubjectName('');
        setIsSidebarOpen(false);
    };

    const updateSubject = (updatedSubject: StudySubject) => {
        const updatedSubjects = subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s);
        onSubjectsChange(updatedSubjects);
    };

    const handleAddResource = () => {
        if (!selectedSubject || !newResourceName.trim()) return;
        const newResource: StudyResource = { id: Date.now(), name: newResourceName };
        const updatedSubject = { ...selectedSubject, resources: [...selectedSubject.resources, newResource] };
        updateSubject(updatedSubject);
        setNewResourceName('');
    };
    
    const handleAddTopic = () => {
        if (!selectedSubject || !newTopicName.trim()) return;
        const newTopic: StudyTopic = { id: Date.now(), name: newTopicName, status: 'not_started' };
        const updatedSubject = { ...selectedSubject, topics: [...selectedSubject.topics, newTopic] };
        updateSubject(updatedSubject);
        setNewTopicName('');
    };

    const handleTopicStatusChange = (topicId: number, newStatus: TopicStatus) => {
        if (!selectedSubject) return;
        const updatedTopics = selectedSubject.topics.map(t => t.id === topicId ? { ...t, status: newStatus } : t);
        updateSubject({ ...selectedSubject, topics: updatedTopics });
    };

    const handleDeleteTopic = (topicId: number) => {
        if (!selectedSubject) return;
        const topic = selectedSubject.topics.find(t => t.id === topicId);
        if (!topic) return;
        
        setDeleteModal({
            isOpen: true,
            itemName: topic.name,
            itemType: 'konu',
            onConfirm: () => {
                const updatedTopics = selectedSubject.topics.filter(t => t.id !== topicId);
                updateSubject({ ...selectedSubject, topics: updatedTopics });
            }
        });
    };

    const handleDeleteSubject = (subjectId: number) => {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) return;
        
        setDeleteModal({
            isOpen: true,
            itemName: subject.name,
            itemType: 'ders',
            onConfirm: () => {
                const updatedSubjects = subjects.filter(s => s.id !== subjectId);
                onSubjectsChange(updatedSubjects);

                if (selectedSubjectId === subjectId) {
                    setSelectedSubjectId(updatedSubjects[0]?.id || null);
                }
            }
        });
    };
    
    const progress = useMemo(() => {
        if (!selectedSubject || selectedSubject.topics.length === 0) return 0;
        const completedCount = selectedSubject.topics.filter(t => t.status === 'completed').length;
        return (completedCount / selectedSubject.topics.length) * 100;
    }, [selectedSubject]);

    const handleSubjectSelect = (subjectId: number) => {
        setSelectedSubjectId(subjectId);
        setIsSidebarOpen(false);
    };

    return (
        <>
        <div className="flex flex-col h-full bg-slate-50">

            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                    >
                        <Bars3Icon className="w-6 h-6 text-slate-600" />
                    </button>
                    {selectedSubject ? (
                        <h2 className="text-xl font-bold text-slate-800">{selectedSubject.name}</h2>
                    ) : (
                        <h2 className="text-xl font-bold text-slate-800">Çalışma Planlayıcı</h2>
                    )}
                </div>
                {selectedSubject && (
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">İlerleme:</span>
                        <span className="text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
                    </div>
                )}
            </div>

            <div className="flex flex-1 min-h-0">

                <div className={`
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0
                    fixed lg:relative
                    top-0 left-0 h-full w-80 lg:w-80
                    bg-white border-r border-slate-200
                    z-30 transition-transform duration-300 ease-in-out
                    lg:z-auto
                `}>
                    <div className="flex flex-col h-full">

                        <div className="p-4 border-b border-slate-200 lg:hidden">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-slate-700 text-lg">Dersler</h3>
                                <button 
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 rounded-md hover:bg-slate-100 transition-colors"
                                >
                                    <XMarkIcon className="w-6 h-6 text-slate-600" />
                                </button>
                            </div>
                        </div>


                        <div className="flex-1 overflow-y-auto p-4">
                            <h3 className="font-semibold text-slate-700 text-lg mb-4 hidden lg:block">Dersler</h3>
                            <div className="space-y-2">
                                {subjects.map(subject => (
                                    <div
                                        key={subject.id}
                                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                            selectedSubjectId === subject.id 
                                                ? 'bg-indigo-600 text-white shadow-md' 
                                                : 'hover:bg-slate-100 text-slate-700'
                                        }`}
                                    >
                                        <button
                                            onClick={() => handleSubjectSelect(subject.id)}
                                            className="flex-1 text-left font-medium"
                                        >
                                            {subject.name}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSubject(subject.id);
                                            }}
                                            className={`p-1 rounded-full transition-colors ${
                                                selectedSubjectId === subject.id
                                                    ? 'text-white hover:bg-white hover:bg-opacity-20'
                                                    : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                            }`}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>


                        <div className="p-4 border-t border-slate-200">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSubjectName}
                                    onChange={e => setNewSubjectName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                                    placeholder="Yeni ders ekle..."
                                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <button 
                                    onClick={handleAddSubject} 
                                    className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                >
                                    <PlusIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}


                <div className="flex-1 flex flex-col min-h-0">
                    {selectedSubject ? (
                        <div className="flex-1 p-4 lg:p-6">

                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 mb-3">{selectedSubject.name}</h3>
                                <div className="sm:hidden mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-slate-600">İlerleme</span>
                                        <span className="text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                                        <div 
                                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-slate-600">İlerleme</span>
                                        <span className="text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                                        <div 
                                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-slate-700 text-xl">Konular</h4>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newTopicName} 
                                            onChange={e => setNewTopicName(e.target.value)}  
                                            onKeyDown={e => e.key === 'Enter' && handleAddTopic()} 
                                            placeholder="Yeni konu ekle..." 
                                            className="px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <button 
                                            onClick={handleAddTopic} 
                                            className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                        >
                                            <PlusIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    {selectedSubject.topics.length > 0 ? selectedSubject.topics.map(topic => (
                                        <div key={topic.id} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <span className="flex-grow font-medium text-slate-800 text-lg">{topic.name}</span>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                    <TopicStatusSelector 
                                                        currentStatus={topic.status} 
                                                        onChange={(newStatus) => handleTopicStatusChange(topic.id, newStatus)} 
                                                    />
                                                    <button 
                                                        onClick={() => onScheduleStudySession(selectedSubject, topic)} 
                                                        className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
                                                    >
                                                        <PlusIcon className="w-4 h-4"/>
                                                        Takvime Ekle
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteTopic(topic.id)} 
                                                        className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                                    >
                                                        <TrashIcon className="w-5 h-5"/>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12">
                                            <BookOpenIcon className="w-16 h-16 mx-auto text-slate-300 mb-4"/>
                                            <h3 className="text-lg font-semibold text-slate-600 mb-2">Henüz Konu Yok</h3>
                                            <p className="text-slate-500">Başlamak için yukarıdan bir konu ekleyin.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-4">
                            <div className="text-center">
                                <BookOpenIcon className="w-16 h-16 mx-auto text-slate-300 mb-4"/>
                                <h3 className="text-lg font-semibold text-slate-600 mb-2">Ders Seçin</h3>
                                <p className="text-slate-500 mb-4">Başlamak için soldaki listeden bir ders seçin veya yeni bir ders ekleyin.</p>
                                <button 
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="lg:hidden px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                >
                                    Dersleri Göster
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        

        <DeleteConfirmationModal
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
            onConfirm={deleteModal.onConfirm}
            itemName={deleteModal.itemName}
            itemType={deleteModal.itemType}
        />
        </>
    );
};