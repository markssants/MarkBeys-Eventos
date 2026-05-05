import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, Calendar, CheckCircle2, AlertCircle, Trash2, Loader2, Landmark } from "lucide-react";
import { EventProject, UserProfile, PaymentItem } from "../../types";
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Payments({ event, profile }: { event: EventProject, profile: UserProfile }) {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPayment, setNewPayment] = useState<{ amount: string; dueDate: string; status: 'paid' | 'pending' }>({ 
    amount: '', 
    dueDate: '', 
    status: 'pending' 
  });

  useEffect(() => {
    const q = query(collection(db, 'events', event.id, 'payments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentItem)));
    });
    return () => unsubscribe();
  }, [event.id]);

  const handleAdd = async () => {
    if (!newPayment.amount || !newPayment.dueDate) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'events', event.id, 'payments'), {
        amount: parseFloat(newPayment.amount),
        dueDate: new Date(newPayment.dueDate),
        status: newPayment.status,
        eventId: event.id,
        createdAt: serverTimestamp(),
      });
      setIsOpen(false);
      setNewPayment({ amount: '', dueDate: '', status: 'pending' });
      toast.success("Pagamento agendado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (p: PaymentItem) => {
    try {
      await updateDoc(doc(db, 'events', event.id, 'payments', p.id), {
        status: p.status === 'paid' ? 'pending' : 'paid',
        paidAt: p.status === 'pending' ? serverTimestamp() : null
      });
      toast.success("Status atualizado!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', event.id, 'payments', id));
      toast.success("Pagamento removido");
    } catch (err) {
      console.error(err);
    }
  };

  const total = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const paid = payments.filter(p => p.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const pending = total - paid;

  return (
    <div className="space-y-8 p-6 font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-400">Fluxo Financeiro</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button className="bg-white/5 text-white hover:bg-white/10 rounded-2xl h-12 px-6 border border-white/10 backdrop-blur-md font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
              <Plus className="w-4 h-4 mr-2 text-cyan-500" />
              Agendar Parcela
            </Button>
          } />
          <DialogContent className="rounded-3xl sm:max-w-[425px] glass border-white/10 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white tracking-tight">Novo Pagamento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Valor do Pagamento (R$)</Label>
                <Input 
                  type="number" 
                  value={newPayment.amount} 
                  onChange={e => setNewPayment({...newPayment, amount: e.target.value})} 
                  placeholder="0.00" 
                  className="rounded-2xl bg-white/5 border-white/10 text-white h-12" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Data de Vencimento</Label>
                <Input 
                  type="date" 
                  value={newPayment.dueDate} 
                  onChange={e => setNewPayment({...newPayment, dueDate: e.target.value})} 
                  className="rounded-2xl bg-white/5 border-white/10 text-white h-12" 
                />
              </div>
              <div className="flex items-center space-x-3 pt-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                <input 
                  type="checkbox" 
                  id="paid" 
                  className="w-5 h-5 rounded-lg border-white/10 bg-white/5 accent-cyan-500"
                  checked={newPayment.status === 'paid'}
                  onChange={e => setNewPayment({...newPayment, status: e.target.checked ? 'paid' : 'pending'})}
                />
                <Label htmlFor="paid" className="text-sm font-bold text-slate-200">Marcar como já pago</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 rounded-2xl h-14 font-black shadow-[0_0_20px_rgba(34,211,238,0.3)] text-white">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Landmark className="mr-2 w-4 h-4" />}
                Confirmar Agendamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-white/5 bg-slate-900/40 backdrop-blur-md shadow-2xl relative overflow-hidden group border">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-[40px] group-hover:scale-150 transition-transform" />
          <CardContent className="p-7 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Total do Projeto</p>
            <h3 className="text-3xl font-black text-white tracking-tight">R$ {total.toLocaleString()}</h3>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-emerald-500/10 bg-emerald-500/5 backdrop-blur-md shadow-2xl relative overflow-hidden group border">
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[40px] group-hover:scale-150 transition-transform" />
          <CardContent className="p-7 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/80 mb-2">Confirmado</p>
            <h3 className="text-3xl font-black text-emerald-400 tracking-tight">R$ {paid.toLocaleString()}</h3>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-pink-500/10 bg-pink-500/5 backdrop-blur-md shadow-2xl relative overflow-hidden group border">
          <div className="absolute top-0 left-0 w-24 h-24 bg-pink-500/10 rounded-full blur-[40px] group-hover:scale-150 transition-transform" />
          <CardContent className="p-7 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500/80 mb-2">Pendente</p>
            <h3 className="text-3xl font-black text-pink-400 tracking-tight">R$ {pending.toLocaleString()}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white/5 rounded-[2.5rem] shadow-2xl border border-white/5 backdrop-blur-md overflow-hidden">
        <header className="px-8 py-7 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pink-500/10 rounded-2xl flex items-center justify-center border border-pink-500/20">
              <Calendar className="w-5 h-5 text-pink-500" />
            </div>
            <h3 className="font-black text-white tracking-tight text-xl">Timeline Financeira</h3>
          </div>
          <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            {payments.length} Parcelas
          </Badge>
        </header>
        <div className="divide-y divide-white/5 font-sans">
          {payments.sort((a,b) => a.dueDate.seconds - b.dueDate.seconds).map((p, idx) => (
            <div key={p.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-white/5 transition-all group">
              <div className="flex items-center space-x-6">
                <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center font-black text-slate-500 text-lg border border-white/5 shadow-2xl group-hover:text-pink-500 transition-colors">
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-black text-white tracking-tight transform group-hover:translate-x-1 transition-transform">R$ {p.amount.toLocaleString()}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center scale-95 origin-left">
                    <Calendar className="w-3 h-3 mr-1.5 text-pink-500 opacity-60" />
                    Vence em {format(p.dueDate.toDate(), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button 
                  onClick={() => toggleStatus(p)}
                  className={`rounded-2xl h-11 px-5 font-black text-[10px] uppercase tracking-[0.15em] transition-all border-none ${
                    p.status === 'paid' 
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800 border border-white/5 hover:text-white'
                  }`}
                >
                  {p.status === 'paid' ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Pago</>
                  ) : (
                    <><AlertCircle className="w-4 h-4 mr-2 opacity-50" /> Pendente</>
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-slate-700 hover:text-rose-500 hover:bg-white/5 rounded-full transition-all">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {payments.length === 0 && (
            <div className="p-16 text-center text-slate-600 flex flex-col items-center">
              <Landmark className="w-16 h-16 mb-4 opacity-10 text-cyan-500" />
              <p className="italic font-bold tracking-tight uppercase text-xs tracking-[0.2em]">Cofre Financeiro Vazio</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
