import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile, EventProject } from "../../types";
import { EventSelector } from "../events/EventSelector";

interface HeaderProps {
  profile: UserProfile;
  events: EventProject[];
  selectedEventId: string | null;
  setSelectedEventId: (id: string) => void;
}

export function Header({ profile, events, selectedEventId, setSelectedEventId }: HeaderProps) {
  return (
    <header className="h-20 glass-header px-6 md:px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4">
          {events.length > 0 ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                <span className="text-white font-black text-xs">EV</span>
              </div>
              <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-[200px] md:w-[280px] bg-white/5 border-white/10 font-bold text-white rounded-2xl focus:ring-1 focus:ring-pink-500 transition-all backdrop-blur-md h-12">
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl bg-slate-900/95 border-white/10 backdrop-blur-xl text-slate-100">
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id} className="cursor-pointer focus:bg-pink-500 font-medium">
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <h1 className="text-xl font-black text-white tracking-tight">Bem-vindo, {profile.name}</h1>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <EventSelector profile={profile} onEventCreated={(id) => setSelectedEventId(id)} isMinimal />
      </div>
    </header>
  );
}
