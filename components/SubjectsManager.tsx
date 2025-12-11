import React, { useState } from 'react';
import { Plan, Subject, Topic } from '../types';
import { ChevronDown, ChevronRight, Plus, Trash2, Book } from 'lucide-react';

interface SubjectsManagerProps {
  plan: Plan;
  onAddSubject: (name: string) => void;
  onAddTopic: (subjectId: string, topicName: string) => void;
  onDeleteSubject: (subjectId: string) => void;
  onDeleteTopic: (subjectId: string, topicId: string) => void;
}

export const SubjectsManager: React.FC<SubjectsManagerProps> = ({ 
  plan, 
  onAddSubject, 
  onAddTopic,
  onDeleteSubject,
  onDeleteTopic
}) => {
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  
  // Track expanded subjects by ID
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedSubjects);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedSubjects(newSet);
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjectName.trim()) {
      onAddSubject(newSubjectName);
      setNewSubjectName('');
      setIsAddingSubject(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Disciplinas & Tópicos</h2>
          <p className="text-slate-500">Organize o conteúdo programático do seu estudo.</p>
        </div>
        <button
          onClick={() => setIsAddingSubject(true)}
          className="flex items-center gap-2 bg-medical-600 text-white px-4 py-2 rounded-lg hover:bg-medical-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Disciplina
        </button>
      </div>

      {isAddingSubject && (
        <div className="mb-6 bg-white p-4 rounded-xl border border-medical-200 shadow-sm animate-fade-in">
          <form onSubmit={handleAddSubject} className="flex gap-3">
            <input
              type="text"
              placeholder="Nome da disciplina (ex: Cardiologia)"
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-medical-500 focus:outline-none"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setIsAddingSubject(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!newSubjectName.trim()}
              className="px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 disabled:opacity-50"
            >
              Adicionar
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {plan.subjects.length === 0 && !isAddingSubject && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
            <Book className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma disciplina cadastrada ainda.</p>
            <p className="text-sm">Clique em "Nova Disciplina" para começar.</p>
          </div>
        )}

        {plan.subjects.map((subject) => (
          <SubjectCard 
            key={subject.id} 
            subject={subject} 
            isExpanded={expandedSubjects.has(subject.id)}
            onToggle={() => toggleExpand(subject.id)}
            onAddTopic={onAddTopic}
            onDelete={onDeleteSubject}
            onDeleteTopic={onDeleteTopic}
          />
        ))}
      </div>
    </div>
  );
};

// Sub-component for individual subject card to manage local "add topic" state cleanly
const SubjectCard: React.FC<{
  subject: Subject;
  isExpanded: boolean;
  onToggle: () => void;
  onAddTopic: (sid: string, name: string) => void;
  onDelete: (sid: string) => void;
  onDeleteTopic: (sid: string, tid: string) => void;
}> = ({ subject, isExpanded, onToggle, onAddTopic, onDelete, onDeleteTopic }) => {
  const [newTopicName, setNewTopicName] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicName.trim()) {
      onAddTopic(subject.id, newTopicName);
      setNewTopicName('');
      // Don't close immediately, allow adding multiple
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
      <div 
        className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-slate-50 border-b border-transparent"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1 rounded-md transition-transform duration-200 ${isExpanded ? 'rotate-90 text-medical-600' : 'text-slate-400'}`}>
            <ChevronRight className="w-5 h-5" />
          </div>
          <span className="font-semibold text-slate-800 text-lg">{subject.name}</span>
          <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-500 rounded-full">
            {subject.topics.length} tópicos
          </span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(subject.id); }}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          title="Excluir disciplina"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="bg-slate-50 p-4 border-t border-slate-100">
          <ul className="space-y-2 mb-4">
            {subject.topics.map((topic) => (
              <li key={topic.id} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-slate-200 text-sm">
                <span className="text-slate-700 font-medium">{topic.name}</span>
                <button
                   onClick={() => onDeleteTopic(subject.id, topic.id)}
                   className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>

          {isAddingTopic ? (
             <form onSubmit={handleAddTopic} className="flex gap-2">
               <input 
                 type="text" 
                 placeholder="Nome do tópico (ex: Hipertensão Arterial)"
                 className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-medical-500 focus:outline-none"
                 value={newTopicName}
                 onChange={(e) => setNewTopicName(e.target.value)}
                 autoFocus
               />
               <button type="submit" disabled={!newTopicName.trim()} className="bg-medical-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-medical-700 disabled:opacity-50">
                 Salvar
               </button>
               <button type="button" onClick={() => setIsAddingTopic(false)} className="bg-white border border-slate-300 text-slate-600 px-3 py-2 rounded-lg text-sm hover:bg-slate-50">
                 Fechar
               </button>
             </form>
          ) : (
            <button 
              onClick={() => setIsAddingTopic(true)}
              className="flex items-center gap-2 text-sm text-medical-600 font-medium hover:text-medical-700 px-2 py-1"
            >
              <Plus className="w-4 h-4" />
              Adicionar Tópico
            </button>
          )}
        </div>
      )}
    </div>
  );
};