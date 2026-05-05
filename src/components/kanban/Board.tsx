import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, MessageSquare, Clock, Calendar, Palette, MoreHorizontal, User } from "lucide-react";
import { EventProject, UserProfile, ArtTask, OperationType } from "../../types";
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError } from "../../firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KanbanBoardProps {
  event: EventProject;
  profile: UserProfile;
}

type ColumnId = 'todo' | 'in-progress' | 'review' | 'done';

const COLUMNS: { id: ColumnId; title: string; color: string }[] = [
  { id: 'todo', title: 'Para Fazer', color: 'bg-slate-500' },
  { id: 'in-progress', title: 'Em Produção', color: 'bg-amber-500' },
  { id: 'review', title: 'Em Revisão', color: 'bg-blue-500' },
  { id: 'done', title: 'Finalizado', color: 'bg-emerald-500' },
];

export function KanbanBoard({ event, profile }: KanbanBoardProps) {
  const [arts, setArts] = useState<ArtTask[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newArt, setNewArt] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: 'dj' as const,
    deadline: '',
    color: '#000000'
  });

  useEffect(() => {
    const q = query(collection(db, 'events', event.id, 'arts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setArts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArtTask)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `events/${event.id}/arts`);
    });
    return () => unsubscribe();
  }, [event.id]);

  const handleAddArt = async () => {
    if (!newArt.title.trim()) return;
    setLoading(true);
    const path = `events/${event.id}/arts`;
    try {
      await addDoc(collection(db, 'events', event.id, 'arts'), {
        ...newArt,
        eventId: event.id,
        status: 'todo',
        createdAt: serverTimestamp(),
      });
      setIsAddOpen(false);
      setNewArt({ title: '', description: '', priority: 'medium', category: 'dj', deadline: '', color: '#000000' });
      toast.success("Arte adicionada ao cronograma!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      toast.error("Erro ao adicionar arte");
    } finally {
      setLoading(false);
    }
  };

  const updateArtStatus = async (artId: string, newStatus: string) => {
    const path = `events/${event.id}/arts/${artId}`;
    try {
      await updateDoc(doc(db, 'events', event.id, 'arts', artId), { status: newStatus });
      toast.success("Status atualizado!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      toast.error("Erro ao atualizar status");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-emerald-500';
      default: return 'bg-zinc-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-pink-400">Cronograma de Artes</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button className="bg-gradient-to-tr from-purple-500 to-pink-500 text-white hover:opacity-90 rounded-2xl px-6 h-12 shadow-[0_0_15px_rgba(236,72,153,0.3)] border-none font-bold transition-all hover:scale-105 active:scale-95">
              <Plus className="w-4 h-4 mr-2" />
              Solicitar Arte
            </Button>
          } />
          <DialogContent className="rounded-3xl sm:max-w-[500px] glass border-white/10 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white tracking-tight">Nova Solicitação de Arte</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Título da Arte</Label>
                <Input 
                  placeholder="Ex: Lineup Completo" 
                  value={newArt.title} 
                  onChange={e => setNewArt({...newArt, title: e.target.value})}
                  className="rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-12 focus:ring-pink-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Prioridade</Label>
                  <Select onValueChange={(v: any) => setNewArt({...newArt, priority: v})} defaultValue="medium">
                    <SelectTrigger className="rounded-2xl bg-white/5 border-white/10 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white">
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Categoria</Label>
                  <Select onValueChange={(v: any) => setNewArt({...newArt, category: v})} defaultValue="dj">
                    <SelectTrigger className="rounded-2xl bg-white/5 border-white/10 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white">
                      <SelectItem value="dj">DJ</SelectItem>
                      <SelectItem value="party">Festa / Local</SelectItem>
                      <SelectItem value="branding">Identidade / Branding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Prazo (Opcional)</Label>
                <Input 
                  type="date" 
                  value={newArt.deadline} 
                  onChange={e => setNewArt({...newArt, deadline: e.target.value})}
                  className="rounded-2xl bg-white/5 border-white/10 text-white h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Descrição / Referências</Label>
                <Textarea 
                  placeholder="Instruções para o designer..." 
                  value={newArt.description} 
                  onChange={e => setNewArt({...newArt, description: e.target.value})}
                  className="rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-24 focus:ring-pink-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddArt} disabled={loading} className="w-full bg-pink-500 hover:bg-pink-600 rounded-2xl h-14 font-black shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                {loading ? "Cadastrando..." : "Adicionar ao Kanban"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
        {COLUMNS.map(column => (
          <div key={column.id} className="flex flex-col space-y-5 rounded-[2rem] bg-white/5 p-5 border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${column.id === 'done' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : column.id === 'review' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : column.id === 'in-progress' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-500'}`} />
                <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.15em]">{column.title}</h3>
              </div>
              <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-500 text-[10px] rounded-full px-2 py-0">
                {arts.filter(a => a.status === column.id).length}
              </Badge>
            </div>

            <div className="flex-1 space-y-4">
              <AnimatePresence>
                {arts.filter(a => a.status === column.id).map(art => (
                  <motion.div
                    key={art.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="rounded-2xl border-white/5 shadow-2xl hover:bg-white/10 transition-all duration-300 group relative overflow-hidden bg-slate-900/60 border backdrop-blur-md">
                      <div className={`absolute top-0 left-0 w-1 h-full shadow-[2px_0_10px_rgba(255,255,255,0.1)] ${getPriorityColor(art.priority)}`} />
                      <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <Badge className={`text-[9px] font-black uppercase tracking-widest rounded-full h-5 px-2 ${
                            art.category === 'dj' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                            art.category === 'party' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                          }`}>
                            {art.category}
                          </Badge>
                          <Select onValueChange={(v) => updateArtStatus(art.id, v)} defaultValue={art.status}>
                            <SelectTrigger className="w-8 h-8 border-none bg-white/5 rounded-lg p-0 flex items-center justify-center hover:bg-white/10 text-slate-400">
                              <MoreHorizontal className="w-4 h-4" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white">
                              <SelectItem value="todo">Para Fazer</SelectItem>
                              <SelectItem value="in-progress">Em Produção</SelectItem>
                              <SelectItem value="review">Revisão</SelectItem>
                              <SelectItem value="done">Finalizado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-bold text-white text-sm leading-tight group-hover:text-pink-100 transition-colors">{art.title}</h4>
                          {art.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 italic font-medium leading-relaxed">{art.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex items-center space-x-2 text-slate-500">
                            <Clock className="w-3 h-3 text-pink-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{art.priority}</span>
                          </div>
                          {art.deadline ? (
                            <div className="flex items-center space-x-1.5 text-slate-500">
                              <Calendar className="w-3 h-3" />
                              <span className="text-[10px] font-black">{format(new Date(art.deadline), "dd/MM", { locale: ptBR })}</span>
                            </div>
                          ) : (
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded-full">Sem Prazo</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              {arts.filter(a => a.status === column.id).length === 0 && (
                <div className="h-32 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-slate-700 text-[10px] font-black uppercase tracking-widest">
                  <Palette className="w-6 h-6 mb-2 opacity-20" />
                  Sem Tarefas
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
