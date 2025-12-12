import React, { useState, useMemo } from 'react';
import { Plan } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Clock } from 'lucide-react';

interface CalendarViewProps {
  plan: Plan;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ plan }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper functions for date manipulation
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Process revisions into a map keyed by date string (YYYY-MM-DD)
  // We use local date strings to ensure visual consistency
  const eventsByDate = useMemo(() => {
    const map: Record<string, Array<{ 
      topic: string; 
      subject: string; 
      label: string; 
      isCompleted: boolean 
    }>> = {};

    plan.subjects.forEach(subject => {
      subject.topics.forEach(topic => {
        topic.revisions.forEach(revision => {
          const revDate = new Date(revision.scheduledDate);
          // Format keys as YYYY-MM-DD based on local time
          const dateKey = revDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format standard
          
          if (!map[dateKey]) {
            map[dateKey] = [];
          }
          map[dateKey].push({
            topic: topic.name,
            subject: subject.name,
            label: revision.label,
            isCompleted: revision.isCompleted
          });
        });
      });
    });
    return map;
  }, [plan]);

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border border-slate-100"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Create date string for lookup (YYYY-MM-DD)
      const currentDayDate = new Date(year, month, day);
      const dateKey = currentDayDate.toLocaleDateString('en-CA');
      const events = eventsByDate[dateKey] || [];
      const isToday = new Date().toDateString() === currentDayDate.toDateString();

      days.push(
        <div 
          key={day} 
          className={`h-32 border border-slate-200 bg-white p-2 overflow-y-auto transition-colors hover:border-medical-300 relative ${isToday ? 'bg-blue-50/30' : ''}`}
        >
          <div className="flex justify-between items-start mb-1 sticky top-0 bg-inherit z-10">
            <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-medical-600 text-white' : 'text-slate-700'}`}>
              {day}
            </span>
            {events.length > 0 && (
              <span className="text-xs text-slate-400 font-medium">{events.length} item(s)</span>
            )}
          </div>
          
          <div className="space-y-1">
            {events.map((evt, idx) => (
              <div 
                key={idx} 
                className={`text-xs p-1.5 rounded border flex items-center gap-1.5 ${
                  evt.isCompleted 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                    : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                }`}
              >
                {evt.isCompleted ? (
                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <Circle className="w-3 h-3 flex-shrink-0 text-medical-500" />
                )}
                <div className="truncate">
                  <span className="font-bold mr-1">{evt.label}:</span>
                  {evt.topic}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Calendário de Revisões</h2>
          <p className="text-slate-500">Visualize seus compromissos mensais.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold text-slate-800 w-40 text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <button 
          onClick={goToToday}
          className="px-4 py-2 text-sm font-medium text-medical-600 bg-medical-50 hover:bg-medical-100 rounded-lg transition-colors"
        >
          Ir para Hoje
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {renderCalendarDays()}
        </div>
      </div>
    </div>
  );
};