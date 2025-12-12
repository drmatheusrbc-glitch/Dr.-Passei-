import React, { useState } from 'react';
import { Plan, Subject, Topic } from '../types';
import { ChevronRight, Plus, Trash2, Book, Pencil, Check, X } from 'lucide-react';

interface SubjectsManagerProps {
  plan: Plan;
  onAddSubject: (name: string) => void;
  onEditSubject: (subjectId: string, name: string) => void;
  onDeleteSubject: (subjectId: string) => void;
  onAddTopic: (subjectId: string, topicName: string) => void;
  onEditTopic: (subjectId: string, topicId: string, name: string) => void;
  onDeleteTopic: (subjectId: string, topicId: string) => void;
}

export const SubjectsManager: React.FC<SubjectsManagerProps> = ({ 
  plan, 
  onAddSubject, 
  onEditSubject,
  onDeleteSubject,
  onAddTopic,
  onEditTopic,
  onDeleteTopic
}) => {
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  
  // Edit State
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  
  // Track expanded subjects by ID
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    // Don't collapse if clicking inside edit input
    if (editingSubjectId === id) return;

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

  const startEditingSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setEditSubjectName(subject.name);
  };

  const saveEditSubject = (subjectId: string) => {
    if (editSubjectName.trim()) {
      onEditSubject(subjectId, editSubjectName);
      setEditingSubjectId(null);
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
          <div key={subject.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
            {/* Subject Header */}
            <div 
              className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-slate-50 border-b border-transparent"
              onClick={() => toggleExpand(subject.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-1 rounded-md transition-transform duration-200 ${expandedSubjects.has(subject.id) ? 'rotate-90 text-medical-600' : 'text-slate-400'}`}>
                  <ChevronRight className="w-5 h-5" />
                </div>
                
                {editingSubjectId === subject.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-4" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="text"
                      className="flex-1 border border-medical-300 rounded px-2 py-1 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-medical-500"
                      value={editSubjectName}
                      onChange={(e) => setEditSubjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditSubject(subject.id);
                        if (e.key === 'Escape') setEditingSubjectId(null);
                      }}
                      autoFocus
                    />
                    <button onClick={() => saveEditSubject(subject.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check className="w-5 h-5"/></button>
                    <button onClick={() => setEditingSubjectId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-5 h-5"/></button>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-slate-800 text-lg">{subject.name}</span>
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-500 rounded-full">
                      {subject.topics.length} tópicos
                    </span>
                  </>
                )}
              </div>

              {editingSubjectId !== subject.id && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); startEditingSubject(subject); }}
                    className="p-2 text-slate-400 hover:text-medical-600 hover:bg-medical-50 rounded-full transition-colors"
                    title="Editar nome"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteSubject(subject.id); }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Excluir disciplina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Topics List */}
            {expandedSubjects.has(subject.id) && (
              <SubjectTopicsList 
                subject={subject}
                onAddTopic={onAddTopic}
                onEditTopic={onEditTopic}
                onDeleteTopic={onDeleteTopic}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Sub-component for Topics List to handle local state per subject cleanly
const SubjectTopicsList: React.FC<{
  subject: Subject;
  onAddTopic: (sid: string, name: string) => void;
  onEditTopic: (sid: string, tid: string, name: string) => void;
  onDeleteTopic: (sid: string, tid: string) => void;
}> = ({ subject, onAddTopic, onEditTopic, onDeleteTopic }) => {
  const [newTopicName, setNewTopicName] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTopicName, setEditTopicName] = useState('');

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicName.trim()) {
      onAddTopic(subject.id, newTopicName);
      setNewTopicName('');
    }
  };

  const startEditing = (topic: Topic) => {
    setEditingTopicId(topic.id);
    setEditTopicName(topic.name);
  };

  const saveEdit = (topicId: string) => {
    if (editTopicName.trim()) {
      onEditTopic(subject.id, topicId, editTopicName);
      setEditingTopicId(null);
    }
  };

  return (
    <div className="bg-slate-50 p-4 border-t border-slate-100">
      <ul className="space-y-2 mb-4">
        {subject.topics.map((topic) => (
          <li key={topic.id} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-slate-200 text-sm">
            {editingTopicId === topic.id ? (
              <div className="flex items-center gap-2 flex-1">
                 <input 
                    type="text"
                    className="flex-1 border border-medical-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-medical-500"
                    value={editTopicName}
                    onChange={(e) => setEditTopicName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(topic.id);
                      if (e.key === 'Escape') setEditingTopicId(null);
                    }}
                    autoFocus
                 />
                 <button onClick={() => saveEdit(topic.id)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Check className="w-4 h-4"/></button>
                 <button onClick={() => setEditingTopicId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X className="w-4 h-4"/></button>
              </div>
            ) : (
              <>
                <span className="text-slate-700 font-medium truncate flex-1">{topic.name}</span>
                <div className="flex items-center gap-1 ml-4">
                  <button
                     onClick={() => startEditing(topic)}
                     className="text-slate-300 hover:text-medical-600 hover:bg-medical-50 p-1 rounded transition-colors"
                     title="Editar tópico"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                     onClick={() => onDeleteTopic(subject.id, topic.id)}
                     className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                     title="Excluir tópico"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
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
  );
};