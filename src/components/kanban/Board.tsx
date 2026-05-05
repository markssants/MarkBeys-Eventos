import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, MessageSquare, Clock, Calendar, Palette, MoreHorizontal, User, ChevronLeft, ChevronRight, Music, PartyPopper, Star, AlertTriangle } from "lucide-react";
import { EventProject, UserProfile, ArtTask, OperationType } from "../../types";
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc, orderBy } from "firebase/firestore";
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
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface KanbanBoardProps {
  event: EventProject;
  profile: UserProfile;
}

type ColumnId = 'todo' | 'production' | 'review' | 'delivered' | 'post' | 'finished';

const COLUMNS: { id: ColumnId; title: string; color: string; textColor: string }[] = [
  { id: 'todo', title: 'Para Fazer', color: 'bg-white', textColor: 'text-white' },
  { id: 'production', title: 'Em Produção', color: 'bg-amber-500', textColor: 'text-amber-500' },
  { id: 'review', title: 'Revisão', color: 'bg-blue-500', textColor: 'text-blue-500' },
  { id: 'delivered', title: 'Entregue', color: 'bg-purple-500', textColor: 'text-purple-500' },
  { id: 'post', title: 'Postar', color: 'bg-pink-500', textColor: 'text-pink-500' },
  { id: 'finished', title: 'Finalizado', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
];

export function KanbanBoard({ event, profile }: KanbanBoardProps) {
  const [arts, setArts] = useState<ArtTask[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'dj' | 'party' | 'branding'>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Form states
  const [newArt, setNewArt] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: 'dj' as const,
    deadline: '',
    color: '#000000'
  });

  const [selectedArt, setSelectedArt] = useState<ArtTask | null>(null);
  const [editArt, setEditArt] = useState<Partial<ArtTask> | null>(null);

  useEffect(() => {
    if (selectedArt) {
      setEditArt({ ...selectedArt });
    } else {
      setEditArt(null);
    }
  }, [selectedArt]);

  useEffect(() => {
    const q = query(collection(db, 'events', event.id, 'arts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedArts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArtTask));
      // Sort in memory: position first, then createdAt
      fetchedArts.sort((a, b) => {
        const posA = a.position ?? 0;
        const posB = b.position ?? 0;
        if (posA !== posB) return posA - posB;
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      });
      setArts(fetchedArts);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `events/${event.id}/arts`);
    });
    return () => unsubscribe();
  }, [event.id]);

  const handleAddArt = async () => {
    if (!newArt.title.trim()) return;
    setLoading(true);
    const path = `events/${event.id}/arts`;
    
    // Calculate new position
    const columnArts = arts.filter(a => a.status === 'todo');
    const maxPosition = columnArts.length > 0 
      ? Math.max(...columnArts.map(a => a.position || 0))
      : 0;

    try {
      await addDoc(collection(db, 'events', event.id, 'arts'), {
        ...newArt,
        eventId: event.id,
        status: 'todo',
        position: maxPosition + 1000, // Large gap for easier reordering if needed
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

  const handleSaveArt = async () => {
    if (!editArt || !selectedArt) return;
    setLoading(true);
    const path = `events/${event.id}/arts/${selectedArt.id}`;
    try {
      await updateDoc(doc(db, 'events', event.id, 'arts', selectedArt.id), {
        title: editArt.title,
        description: editArt.description,
        priority: editArt.priority,
        category: editArt.category,
        deadline: editArt.deadline,
        status: editArt.status
      });
      toast.success("Alterações salvas!");
      setSelectedArt(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      toast.error("Erro ao salvar alterações");
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

  const handleDeleteArt = async (artId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta arte?")) return;
    const path = `events/${event.id}/arts/${artId}`;
    try {
      await deleteDoc(doc(db, 'events', event.id, 'arts', artId));
      setSelectedArt(null);
      toast.success("Arte excluída!");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      toast.error("Erro ao excluir arte");
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

  const translateCategory = (cat: string) => {
    switch (cat) {
      case 'dj': return 'DJ';
      case 'party': return 'Festa';
      case 'branding': return 'Branding';
      default: return cat;
    }
  };

  const translatePriority = (priority: string) => {
    switch (priority) {
      case 'high': return 'Urgente';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const translateStatus = (statusId: string) => {
    const col = COLUMNS.find(c => c.id === statusId);
    return col ? col.title : statusId;
  };

  const getStatusColorClasses = (statusId: string) => {
    switch (statusId) {
      case 'todo': return 'bg-white/20 text-white border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.1)]';
      case 'production': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'review': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'delivered': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'post': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'finished': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-white/5 text-slate-400 border-white/10';
    }
  };

  const getStatusIconColor = (statusId: string) => {
    switch (statusId) {
      case 'todo': return 'text-white';
      case 'production': return 'text-amber-400';
      case 'review': return 'text-blue-400';
      case 'delivered': return 'text-purple-400';
      case 'post': return 'text-pink-400';
      case 'finished': return 'text-emerald-400';
      default: return 'text-blue-400';
    }
  };

  const filteredArts = arts.filter(a => {
    const matchesPriority = priorityFilter === 'all' || a.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    return matchesPriority && matchesCategory;
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;
    const destIndex = destination.index;

    // Get all items in the destination column (excluding the one being moved if it's already there)
    const columnArts = arts
      .filter(a => a.status === destStatus)
      .filter(a => a.id !== draggableId)
      .sort((a, b) => {
        const posA = a.position ?? 0;
        const posB = b.position ?? 0;
        if (posA !== posB) return posA - posB;
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      });

    let newPosition: number;

    if (columnArts.length === 0) {
      // Empty column
      newPosition = 1000;
    } else if (destIndex === 0) {
      // Move to top
      newPosition = (columnArts[0].position ?? 0) - 1000;
    } else if (destIndex >= columnArts.length) {
      // Move to bottom
      newPosition = (columnArts[columnArts.length - 1].position ?? 0) + 1000;
    } else {
      // Move between two items
      const prevPos = columnArts[destIndex - 1].position ?? 0;
      const nextPos = columnArts[destIndex].position ?? 0;
      
      if (prevPos === nextPos) {
        newPosition = prevPos + 0.5;
      } else {
        newPosition = (prevPos + nextPos) / 2;
      }
    }

    const path = `events/${event.id}/arts/${draggableId}`;
    try {
      await updateDoc(doc(db, 'events', event.id, 'arts', draggableId), {
        status: destStatus,
        position: newPosition
      });
      // No toast here to keep it smooth
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      toast.error("Erro ao reordenar arte");
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-white/[0.02] p-6 rounded-[2.5rem] border border-white/5 shadow-inner">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-3.5 h-3.5 text-pink-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Filtrar por Categoria</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button 
              variant={categoryFilter === 'dj' ? "secondary" : "outline"}
              onClick={() => setCategoryFilter(categoryFilter === 'dj' ? 'all' : 'dj')}
              className={cn(
                "rounded-xl text-[10px] font-black uppercase tracking-widest h-9 px-4 transition-all",
                categoryFilter === 'dj' ? "bg-purple-500/20 text-purple-400 border-purple-500/40" : "bg-white/5 border-white/5 text-slate-500 hover:bg-purple-500/10"
              )}
            >
              🎧 DJs
            </Button>
            <Button 
              variant={categoryFilter === 'party' ? "secondary" : "outline"}
              onClick={() => setCategoryFilter(categoryFilter === 'party' ? 'all' : 'party')}
              className={cn(
                "rounded-xl text-[10px] font-black uppercase tracking-widest h-9 px-4 transition-all",
                categoryFilter === 'party' ? "bg-blue-500/20 text-blue-400 border-blue-500/40" : "bg-white/5 border-white/5 text-slate-500 hover:bg-blue-500/10"
              )}
            >
              🎪 Festa
            </Button>
            <Button 
              variant={categoryFilter === 'branding' ? "secondary" : "outline"}
              onClick={() => setCategoryFilter(categoryFilter === 'branding' ? 'all' : 'branding')}
              className={cn(
                "rounded-xl text-[10px] font-black uppercase tracking-widest h-9 px-4 transition-all",
                categoryFilter === 'branding' ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-white/5 border-white/5 text-slate-500 hover:bg-amber-500/10"
              )}
            >
              ⭐ Branding
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-6 lg:items-center">
          <div className="flex flex-col gap-2 md:items-end md:ml-auto">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Prioridade</span>
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setPriorityFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all",
                  priorityFilter === 'all' ? "bg-white/10 text-white" : "text-slate-600 hover:text-slate-400"
                )}
              >
                Todas
              </button>
              <button 
                onClick={() => setPriorityFilter('high')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[9px] font-black uppercase tracking-tighter",
                  priorityFilter === 'high' ? "bg-red-500/20 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "text-slate-700 hover:text-red-400/50"
                )}
              >
                <span className="text-[10px]">🔴</span>
                <span>Urgente</span>
              </button>
              <button 
                onClick={() => setPriorityFilter('medium')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[9px] font-black uppercase tracking-tighter",
                  priorityFilter === 'medium' ? "bg-amber-500/20 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]" : "text-slate-700 hover:text-amber-400/50"
                )}
              >
                <span className="text-[10px]">🟡</span>
                <span>Média</span>
              </button>
              <button 
                onClick={() => setPriorityFilter('low')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[9px] font-black uppercase tracking-tighter",
                  priorityFilter === 'low' ? "bg-emerald-500/20 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "text-slate-700 hover:text-emerald-400/50"
                )}
              >
                <span className="text-[10px]">🟢</span>
                <span>Baixa</span>
              </button>
            </div>
          </div>

          <div className="h-10 w-[1px] bg-white/5 hidden lg:block mx-2" />

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
              <Button className="bg-gradient-to-tr from-purple-500 to-pink-500 text-white hover:opacity-90 rounded-2xl w-12 h-12 flex items-center justify-center p-0 shadow-[0_0_15px_rgba(236,72,153,0.3)] border-none font-black transition-all hover:scale-105 active:scale-95">
                <Plus className="w-5 h-5" />
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
                      <SelectItem value="high">Urgente</SelectItem>
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
                      <SelectItem value="party">Festa</SelectItem>
                      <SelectItem value="branding">Branding</SelectItem>
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
      </div>

      <div className="relative group/scroll">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 pointer-events-none">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            className="w-12 h-12 rounded-full glass border-white/20 text-white shadow-2xl hover:scale-110 active:scale-90 pointer-events-auto bg-black/40 backdrop-blur-md"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </div>
        
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 pointer-events-none">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="w-12 h-12 rounded-full glass border-white/20 text-white shadow-2xl hover:scale-110 active:scale-90 pointer-events-auto bg-black/40 backdrop-blur-md"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto pb-8 gap-6 min-h-[600px] custom-scrollbar snap-x px-2"
        >
          {COLUMNS.map(column => (
          <div key={column.id} className="flex flex-col space-y-3 rounded-3xl bg-white/5 p-4 border border-white/5 backdrop-blur-md w-[280px] shrink-0 shadow-2xl snap-center transition-transform hover:scale-[1.01]">
            <div className="flex items-center justify-between px-1 mb-6">
              <div className="flex items-center space-x-3">
                <div className={cn("w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]", column.color)} />
                <h3 className={cn("font-black uppercase text-[10px] tracking-[0.2em]", column.textColor)}>{column.title}</h3>
              </div>
              <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-400 text-[9px] rounded-full px-2 py-0.5 h-4 flex items-center">
                {filteredArts.filter(a => a.status === column.id).length}
              </Badge>
            </div>

            <div className="flex-1 space-y-3">
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex-1 space-y-3 min-h-[100px]"
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredArts.filter(a => a.status === column.id).map((art, index) => (
                        <Draggable key={art.id} draggableId={art.id} index={index}>
                          {(provided, snapshot) => {
                            const child = (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  cursor: snapshot.isDragging ? 'grabbing' : 'pointer'
                                }}
                                className={cn(
                                  "relative",
                                  snapshot.isDragging && "z-[9999]"
                                )}
                              >
                                <motion.div
                                  key={art.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ 
                                    opacity: 1, 
                                    scale: snapshot.isDragging ? 1.05 : 1, 
                                    y: 0,
                                    rotate: snapshot.isDragging ? 2 : 0,
                                  }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ 
                                    type: "spring", 
                                    damping: 25, 
                                    stiffness: 350
                                  }}
                                >
                                  <Card 
                                    onClick={() => !snapshot.isDragging && setSelectedArt(art)}
                                    className={cn(
                                      "rounded-xl border-white/5 shadow-2xl hover:bg-white/10 transition-all duration-300 group relative overflow-hidden backdrop-blur-md cursor-pointer",
                                      snapshot.isDragging ? "bg-slate-800 border-white/20" : "bg-slate-900/60 border"
                                    )}
                                  >
                                    <div className={`absolute top-0 left-0 w-1 h-full shadow-[2px_0_15px_rgba(255,255,255,0.05)] ${getPriorityColor(art.priority)}`} />
                                    <CardContent className="p-2.5 space-y-2">
                                      <div className="flex justify-end items-start -mb-4 relative z-10 pr-1.5">
                                        <span className="text-sm filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                                          {art.category === 'dj' && '🎧'}
                                          {art.category === 'party' && '🎪'}
                                          {art.category === 'branding' && '⭐️'}
                                        </span>
                                      </div>

                                      <div className="space-y-0.5 pl-1.5">
                                        <h4 className="font-black text-white text-[12px] leading-tight group-hover:text-pink-300 transition-colors uppercase tracking-tight pr-6">{art.title}</h4>
                                        {art.description && (
                                          <p className="text-[9px] text-slate-400 line-clamp-2 italic font-medium leading-[1.4] opacity-70 group-hover:opacity-100 transition-opacity">
                                            {art.description}
                                          </p>
                                        )}
                                      </div>

                                      <div className="flex items-center justify-between pt-2 border-t border-white/5 px-1.5">
                                        <div className="flex items-center space-x-2 text-slate-500">
                                          {art.priority === 'high' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                          {art.priority === 'medium' && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                                          {art.priority === 'low' && <Clock className="w-3 h-3 text-emerald-400" />}
                                          <span className="text-[8px] font-black uppercase tracking-[0.1em]">{translatePriority(art.priority)}</span>
                                        </div>
                                        {art.deadline ? (
                                          <div className="flex items-center space-x-1 text-slate-400">
                                            <Calendar className="w-2.5 h-2.5 text-blue-400" />
                                            <span className="text-[8px] font-black tracking-tighter">
                                              {format(new Date(art.deadline), "dd/MM", { locale: ptBR })}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded-full bg-white/[0.02]">
                                            S/ Prazo
                                          </span>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              </div>
                            );

                            if (snapshot.isDragging) {
                              return createPortal(child, document.body);
                            }
                            return child;
                          }}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                    {filteredArts.filter(a => a.status === column.id).length === 0 && (
                      <div className="h-32 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-700/50 text-[9px] font-black uppercase tracking-widest bg-white/[0.01]">
                        <Palette className="w-6 h-6 mb-2 opacity-20" />
                        Sem Tarefas
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
        </div>
      </DragDropContext>

      <Dialog open={!!selectedArt} onOpenChange={(open) => !open && setSelectedArt(null)}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-[600px] glass border-white/10 text-slate-100 p-0 overflow-hidden">
          {selectedArt && editArt && (
            <div className="flex flex-col">
              <div className={`h-2 w-full ${getPriorityColor(editArt.priority || 'medium')} shadow-[0_4px_10px_rgba(0,0,0,0.3)]`} />
              <div className="p-8 space-y-8">
                <DialogHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                       <Select onValueChange={(v: any) => setEditArt({...editArt, category: v})} value={editArt.category}>
                        <SelectTrigger className="h-8 rounded-full border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest px-4 flex items-center gap-2 min-w-[80px]">
                          {editArt.category === 'dj' && <Music className="w-3 h-3 text-purple-400" />}
                          {editArt.category === 'party' && <PartyPopper className="w-3 h-3 text-blue-400" />}
                          {editArt.category === 'branding' && <Star className="w-3 h-3 text-amber-400" />}
                          <span>{translateCategory(editArt.category || '')}</span>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white">
                          <SelectItem value="dj" className="flex items-center gap-2"><Music className="w-3 h-3 inline mr-2" /> DJ</SelectItem>
                          <SelectItem value="party" className="flex items-center gap-2"><PartyPopper className="w-3 h-3 inline mr-2" /> Festa</SelectItem>
                          <SelectItem value="branding" className="flex items-center gap-2"><Star className="w-3 h-3 inline mr-2" /> Branding</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select onValueChange={(v: any) => setEditArt({...editArt, priority: v})} value={editArt.priority}>
                        <SelectTrigger className="h-8 rounded-full border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest px-4 flex items-center gap-2 min-w-[80px]">
                          {editArt.priority === 'low' && <Clock className="w-3 h-3 text-emerald-400" />}
                          {editArt.priority === 'medium' && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                          {editArt.priority === 'high' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                          <span>{translatePriority(editArt.priority || '')}</span>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white">
                          <SelectItem value="low"><Clock className="w-3 h-3 inline mr-2 text-emerald-400" /> Baixa</SelectItem>
                          <SelectItem value="medium"><AlertTriangle className="w-3 h-3 inline mr-2 text-yellow-400" /> Média</SelectItem>
                          <SelectItem value="high"><AlertTriangle className="w-3 h-3 inline mr-2 text-red-400" /> Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Input 
                    value={editArt.title} 
                    onChange={e => setEditArt({...editArt, title: e.target.value})}
                    className="text-2xl font-black text-white tracking-tight border-none bg-white/5 rounded-2xl h-14 focus:ring-pink-500 uppercase italic px-6"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Select onValueChange={(v: any) => setEditArt({...editArt, status: v})} value={editArt.status}>
                      <SelectTrigger className={cn(
                        "h-8 rounded-full border text-[10px] font-black uppercase tracking-widest px-4 flex items-center gap-2 min-w-[80px] transition-all",
                        getStatusColorClasses(editArt.status || '')
                      )}>
                        <Palette className={cn("w-3 h-3", getStatusIconColor(editArt.status || ''))} />
                        <span>{translateStatus(editArt.status || '')}</span>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white">
                        {COLUMNS.map(col => (
                          <SelectItem key={col.id} value={col.id} className="rounded-xl focus:bg-white/10 font-bold uppercase text-[10px] tracking-widest">
                            {col.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="relative group/date">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Calendar className="w-3 h-3 text-pink-400" />
                      </div>
                      <Input 
                        type="date"
                        value={editArt.deadline || ''}
                        onChange={e => setEditArt({...editArt, deadline: e.target.value})}
                        className="h-8 rounded-full border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest pl-8 pr-4 w-[130px] focus:ring-0 focus:border-white/20 cursor-pointer"
                      />
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">Descrição & Instruções</Label>
                    <Textarea 
                      value={editArt.description}
                      onChange={e => setEditArt({...editArt, description: e.target.value})}
                      placeholder="Instruções para o designer..."
                      className="p-6 rounded-[2rem] bg-black/40 border border-white/5 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap italic font-medium min-h-[150px] focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    onClick={handleSaveArt}
                    disabled={loading}
                    className="flex-1 rounded-[1.5rem] h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-none text-white font-black uppercase text-xs tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteArt(selectedArt.id)}
                    className="w-14 h-14 rounded-[1.5rem] border-none bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                  >
                    <Palette className="w-5 h-5 rotate-45" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  </div>
  );
}
