import { useState, useEffect } from 'react';
import { UserProfile, EventProject, OperationType } from '../../types';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError } from '../../firebase';
import { Sidebar } from './Sidebar';
import { Overview } from './Overview';
import { KanbanBoard } from '../kanban/Board';
import { DjAssets } from '../dj/DjAssets';
import { Documents } from '../docs/Documents';
import { Payments } from '../payments/Payments';
import { EventSelector } from '../events/EventSelector';
import { Header } from './Header';
import { signOut } from 'firebase/auth';
import { Palette } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
}

export type ViewType = 'overview' | 'arts' | 'dj' | 'docs' | 'payments';

export function Dashboard({ profile }: DashboardProps) {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [events, setEvents] = useState<EventProject[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'events'),
      where(profile.role === 'designer' ? 'designerId' : 'contractorId', '==', profile.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventProject));
      setEvents(eventList);
      if (eventList.length > 0 && !selectedEventId) {
        setSelectedEventId(eventList[0].id);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'events');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile.id, profile.role, selectedEventId]);

  const activeEvent = events.find(e => e.id === selectedEventId);

  const handleLogout = () => signOut(auth);

  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        profile={profile} 
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          profile={profile} 
          events={events}
          selectedEventId={selectedEventId}
          setSelectedEventId={setSelectedEventId}
        />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {!selectedEventId && !loading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Palette className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-white">Nenhum evento encontrado</h3>
                <p className="text-slate-400">Comece criando um novo evento para gerenciar suas artes.</p>
                <EventSelector 
                  profile={profile} 
                  onEventCreated={(id) => setSelectedEventId(id)}
                />
              </div>
            </div>
          )}

          {activeEvent && (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
              {activeView === 'overview' && <Overview event={activeEvent} profile={profile} />}
              {activeView === 'arts' && <KanbanBoard event={activeEvent} profile={profile} />}
              {activeView === 'dj' && <DjAssets event={activeEvent} profile={profile} />}
              {activeView === 'docs' && <Documents event={activeEvent} profile={profile} />}
              {activeView === 'payments' && <Payments event={activeEvent} profile={profile} />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
