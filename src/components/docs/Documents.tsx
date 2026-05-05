import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Download, Trash2, Loader2, Link as LinkIcon, ShieldCheck } from "lucide-react";
import { EventProject, UserProfile, ProjectDocument } from "../../types";
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError } from "../../firebase";
import { OperationType } from "../../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function Documents({ event, profile }: { event: EventProject, profile: UserProfile }) {
  const [docs, setDocs] = useState<ProjectDocument[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', url: '', type: 'contract' as const });

  useEffect(() => {
    const q = query(collection(db, 'events', event.id, 'documents'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectDocument)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `events/${event.id}/documents`);
    });
    return () => unsubscribe();
  }, [event.id]);

  const handleAdd = async () => {
    if (!newDoc.name.trim() || !newDoc.url.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'events', event.id, 'documents'), {
        ...newDoc,
        eventId: event.id,
        createdAt: serverTimestamp(),
      });
      setIsOpen(false);
      setNewDoc({ name: '', url: '', type: 'contract' });
      toast.success("Documento armazenado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', event.id, 'documents', id));
      toast.success("Documento removido");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">Cofre de Documentos</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button className="bg-white/5 text-white hover:bg-white/10 rounded-2xl h-12 px-6 border border-white/10 backdrop-blur-md font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
              <Plus className="w-4 h-4 mr-2 text-emerald-500" />
              Anexar Arquivo
            </Button>
          } />
          <DialogContent className="rounded-3xl sm:max-w-[425px] glass border-white/10 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white tracking-tight">Anexar Documento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nome do Arquivo</Label>
                <Input value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} placeholder="Ex: Contrato assinado.pdf" className="rounded-2xl bg-white/5 border-white/10 text-white h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Tipo</Label>
                <Select onValueChange={(v: any) => setNewDoc({...newDoc, type: v})} defaultValue="contract">
                  <SelectTrigger className="rounded-2xl bg-white/5 border-white/10 text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white">
                    <SelectItem value="contract">Contrato</SelectItem>
                    <SelectItem value="receipt">Recibo / Comprovante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">URL do Arquivo (Link)</Label>
                <Input value={newDoc.url} onChange={e => setNewDoc({...newDoc, url: e.target.value})} placeholder="Link do Google Drive / Dropbox" className="rounded-2xl bg-white/5 border-white/10 text-white h-12" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-2xl h-14 font-black shadow-[0_0_20px_rgba(16,185,129,0.3)] text-white">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2 w-4 h-4" />}
                Armazenar com Segurança
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
        {docs.map(doc => (
          <Card key={doc.id} className="rounded-[2rem] border-white/5 bg-white/5 backdrop-blur-md shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group overflow-hidden border">
            <CardContent className="p-0">
              <div className={`h-2 transition-all duration-500 ${doc.type === 'contract' ? 'bg-indigo-500 group-hover:h-3' : 'bg-emerald-500 group-hover:h-3'}`} />
              <div className="p-7 space-y-5">
                <div className="flex items-start justify-between">
                  <div className={`p-4 rounded-2xl border ${doc.type === 'contract' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} className="text-slate-600 hover:text-rose-500 hover:bg-white/5 rounded-full transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-tight text-lg line-clamp-1">{doc.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">{doc.type === 'contract' ? '📄 Contrato Oficial' : '🧾 Comprovante de Pagamento'}</p>
                </div>
                <div className="pt-2">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" className="w-full rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-100 font-bold group/btn h-12">
                      <Download className="mr-2 w-4 h-4 text-emerald-400 group-hover/btn:translate-y-0.5 transition-transform" />
                      Baixar Arquivo
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {docs.length === 0 && (
          <div className="col-span-full h-56 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 text-slate-600 bg-white/5">
            <ShieldCheck className="w-10 h-10 opacity-20 text-emerald-500" />
            <p className="italic font-bold tracking-tight">Nenhum contrato ou recibo anexado.</p>
          </div>
        )}
      </div>

      <div className="glass-card rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] group-hover:scale-150 transition-transform duration-1000" />
        <div className="space-y-3 text-center md:text-left relative z-10">
          <h4 className="text-2xl font-black tracking-tight flex items-center justify-center md:justify-start">
            <ShieldCheck className="mr-3 w-7 h-7 text-emerald-500" />
            Segurança Beys Arts
          </h4>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed font-medium italic">
            Todos os documentos são armazenados em links externos seguros. A Beys Arts não hospeda arquivos físicos, garantindo que você tenha controle total sobre seu armazenamento.
          </p>
        </div>
        <div className="flex -space-x-4 relative z-10">
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="w-12 h-12 rounded-full bg-slate-900 border-2 border-white/10 flex items-center justify-center shadow-2xl transform hover:-translate-y-2 transition-transform">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
