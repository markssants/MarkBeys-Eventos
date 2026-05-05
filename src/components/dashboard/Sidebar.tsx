import { motion } from "motion/react";
import { LayoutDashboard, Palette, Music, FileText, CreditCard, LogOut, Brush, Users } from "lucide-react";
import { ViewType } from "./Dashboard";
import { UserProfile } from "../../types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  profile: UserProfile;
  onLogout: () => void;
}

export function Sidebar({ activeView, setActiveView, profile, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'overview' as ViewType, label: 'Resumo', icon: LayoutDashboard },
    { id: 'arts' as ViewType, label: 'Artes', icon: Palette },
    { id: 'dj' as ViewType, label: 'DJs & Presskits', icon: Music },
    { id: 'docs' as ViewType, label: 'Corregedoria', icon: FileText },
    { id: 'drive' as ViewType, label: 'Documentos', icon: FileText },
    { id: 'payments' as ViewType, label: 'Pagamentos', icon: CreditCard },
  ];

  return (
    <aside className="w-64 glass-sidebar text-slate-400 flex flex-col hidden md:flex">
      <div className="p-6">
        <div className="flex items-center space-x-3 text-white mb-10 mt-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            M
          </div>
          <span className="font-bold tracking-tighter text-xl">MARKS EVENTOS</span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group text-sm font-bold relative overflow-hidden",
                  isActive 
                    ? "text-white bg-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" 
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]" : "bg-white/5 text-slate-500 group-hover:bg-white/10"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-glow"
                    className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent pointer-events-none"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-6">
        <div className="flex items-center space-x-3 px-3 py-4 bg-white/5 rounded-2xl border border-white/5">
          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-pink-500/50 flex items-center justify-center text-slate-100 overflow-hidden">
            {profile.role === 'designer' ? <Palette className="w-5 h-5 text-pink-400" /> : <Users className="w-5 h-5 text-purple-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{profile.name}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
              {profile.role === 'designer' ? 'Designer' : 'Contratante'}
            </p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={onLogout}
          className="w-full justify-start text-slate-500 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"
        >
          <LogOut className="mr-2 w-4 h-4 text-pink-500" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
