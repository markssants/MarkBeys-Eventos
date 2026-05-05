import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Music, ExternalLink, Clock, Trash2, Loader2, Disc } from "lucide-react";
import { EventProject, UserProfile, DjAsset } from "../../types";
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError } from "../../firebase";
import { OperationType } from "../../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DjAssetsProps {
  event: EventProject;
  profile: UserProfile;
}

export function DjAssets({ event, profile }: DjAssetsProps) {
  const [assets, setAssets] = useState<DjAsset[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [newAsset, setNewAsset] = useState({
    name: '',
    presskitUrl: '',
    musicName: '',
    musicUrl: '',
    musicDuration: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'events', event.id, 'dj_assets'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DjAsset)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `events/${event.id}/dj_assets`);
    });
    return () => unsubscribe();
  }, [event.id]);

  const handleAdd = async () => {
    if (!newAsset.name.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'events', event.id, 'dj_assets'), {
        ...newAsset,
        eventId: event.id,
        createdAt: serverTimestamp(),
      });
      setIsOpen(false);
      setNewAsset({ name: '', presskitUrl: '', musicName: '', musicUrl: '', musicDuration: '' });
      toast.success("DJ adicionado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao adicionar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', event.id, 'dj_assets', id));
      toast.success("Removido");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-purple-400">Presskits & Playlist</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button className="bg-white/5 text-white hover:bg-white/10 rounded-2xl h-12 px-6 border border-white/10 backdrop-blur-md font-bold transition-all hover:scale-105 active:scale-95">
              <Plus className="w-4 h-4 mr-2 text-pink-500" />
              Adicionar DJ
            </Button>
          } />
          <DialogContent className="rounded-3xl sm:max-w-[500px] glass border-white/10 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white tracking-tight">Informações do DJ</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nome do DJ / Atração</Label>
                <Input value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="rounded-2xl bg-white/5 border-white/10 text-white h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Link do Presskit (Drive/Dropbox)</Label>
                <Input value={newAsset.presskitUrl} onChange={e => setNewAsset({...newAsset, presskitUrl: e.target.value})} className="rounded-2xl bg-white/5 border-white/10 text-white h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Musica de Entrada (Nome)</Label>
                <Input value={newAsset.musicName} onChange={e => setNewAsset({...newAsset, musicName: e.target.value})} className="rounded-2xl bg-white/5 border-white/10 text-white h-12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Link da Musica</Label>
                  <Input value={newAsset.musicUrl} onChange={e => setNewAsset({...newAsset, musicUrl: e.target.value})} className="rounded-2xl bg-white/5 border-white/10 text-white h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Tempo / Minuto</Label>
                  <Input value={newAsset.musicDuration} onChange={e => setNewAsset({...newAsset, musicDuration: e.target.value})} placeholder="Ex: 01:20" className="rounded-2xl bg-white/5 border-white/10 text-white h-12" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={loading} className="w-full bg-pink-500 hover:bg-pink-600 rounded-2xl h-14 font-black shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                {loading ? <Loader2 className="animate-spin" /> : "Salvar DJ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map(asset => (
          <Card key={asset.id} className="rounded-[2rem] border-white/5 bg-white/5 backdrop-blur-md shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 overflow-hidden group border">
            <div className="bg-white/5 p-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center space-x-4 text-white">
                <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                  <Disc className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight text-white">{asset.name}</h3>
                  <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest leading-none">Presskit Disponível</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(asset.id)} className="text-slate-600 hover:text-rose-500 hover:bg-white/5 rounded-full transition-colors">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Recursos Visuais</p>
                <a 
                  href={asset.presskitUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group/link"
                >
                  <div className="flex items-center space-x-3">
                    <Music className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-bold text-slate-200">Ver Presskit & Fotos</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover/link:text-pink-400 transition-colors" />
                </a>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Música de Entrada</p>
                <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-[1.5rem] border border-white/5 relative overflow-hidden group/track">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-white truncate max-w-[150px]">{asset.musicName || "Não informada"}</p>
                      <div className="flex items-center space-x-2 text-slate-500">
                        <Clock className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-black uppercase">{asset.musicDuration || "--"}</span>
                      </div>
                    </div>
                    {asset.musicUrl && (
                      <a href={asset.musicUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                        <Button size="icon" variant="ghost" className="rounded-full bg-white/10 hover:bg-pink-500 hover:text-white transition-all shadow-lg">
                          <Music className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-purple-500/20 rounded-full blur-[20px] transition-all group-hover/track:scale-150 group-hover/track:bg-pink-500/20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {assets.length === 0 && (
          <div className="col-span-full h-64 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 text-slate-600 bg-white/5">
            <Music className="w-12 h-12 opacity-20 text-purple-500" />
            <p className="italic font-bold tracking-tight">Nenhum DJ cadastrado para este evento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
