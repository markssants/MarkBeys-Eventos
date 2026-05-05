import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile, OperationType } from "../../types";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError } from "../../firebase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EventSelectorProps {
  profile: UserProfile;
  onEventCreated: (id: string) => void;
  isMinimal?: boolean;
}

export function EventSelector({ profile, onEventCreated, isMinimal }: EventSelectorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [contractorEmail, setContractorEmail] = useState('');
  const [designerEmail, setDesignerEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      // For simplicity, we just save emails and IDs. 
      // In a real app we'd resolve email to user UID.
      const newEvent = {
        name,
        logoUrl: logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
        contractorId: profile.role === 'contractor' ? profile.id : 'unresolved',
        designerId: profile.role === 'designer' ? profile.id : 'unresolved',
        status: 'planning',
        createdAt: serverTimestamp(),
        // Storing emails to allow members to find it
        contractorEmail: profile.role === 'contractor' ? profile.email : contractorEmail,
        designerEmail: profile.role === 'designer' ? profile.email : designerEmail,
      };

      const docRef = await addDoc(collection(db, 'events'), newEvent);
      onEventCreated(docRef.id);
      setOpen(false);
      setName('');
      setLogoUrl('');
      toast.success("Evento criado com sucesso!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'events');
      toast.error("Erro ao criar evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button 
          variant={isMinimal ? "ghost" : "default"} 
          className={cn(
            "rounded-2xl transition-all duration-300 font-bold",
            isMinimal 
              ? "bg-white/5 text-white hover:bg-white/10 border border-white/5 h-10 px-4" 
              : "bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:scale-105 h-12 px-6"
          )}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Evento
        </Button>
      } />
      <DialogContent className="rounded-[2.5rem] sm:max-w-[450px] glass border-white/10 text-slate-100 p-8">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black text-white tracking-tighter">Cadastrar Festa</DialogTitle>
          <DialogDescription className="text-slate-400">
            Inicie um novo projeto para gerenciar as artes e DJs.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest text-slate-500">Nome da Festa</Label>
            <Input 
              id="name" 
              placeholder="Ex: Baile do Beys 2026" 
              className="rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-700 h-12 focus:ring-pink-500 transition-all font-semibold"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo" className="text-[10px] uppercase font-black tracking-widest text-slate-500">Logo (URL opcional)</Label>
            <Input 
              id="logo" 
              placeholder="https://exemplo.com/logo.png" 
              className="rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-700 h-12 focus:ring-pink-500"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>
          {profile.role === 'designer' ? (
            <div className="space-y-2">
              <Label htmlFor="cemail" className="text-[10px] uppercase font-black tracking-widest text-slate-500">Email do Contratante</Label>
              <Input 
                id="cemail" 
                placeholder="email@cliente.com" 
                className="rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-700 h-12"
                value={contractorEmail}
                onChange={(e) => setContractorEmail(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="demail" className="text-[10px] uppercase font-black tracking-widest text-slate-500">Email do Designer (Beys)</Label>
              <Input 
                id="demail" 
                placeholder="beysarts@gmail.com" 
                className="rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-700 h-12"
                value={designerEmail}
                onChange={(e) => setDesignerEmail(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            disabled={loading || !name.trim()} 
            onClick={handleCreate} 
            className="w-full bg-pink-500 hover:bg-pink-600 text-white rounded-2xl h-14 font-black shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 w-5 h-5" />}
            Criar Evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
