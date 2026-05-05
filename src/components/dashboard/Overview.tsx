import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EventProject, UserProfile, ArtTask, PaymentItem, OperationType } from "../../types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError } from "../../firebase";
import { Palette, CheckCircle2, Clock, AlertCircle, CreditCard, Music } from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OverviewProps {
  event: EventProject;
  profile: UserProfile;
}

export function Overview({ event }: OverviewProps) {
  const [arts, setArts] = useState<ArtTask[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);

  useEffect(() => {
    const artsQ = query(collection(db, 'events', event.id, 'arts'));
    const paymentsQ = query(collection(db, 'events', event.id, 'payments'));

    const unsubscribeArts = onSnapshot(artsQ, (snapshot) => {
      setArts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArtTask)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `events/${event.id}/arts`);
    });

    const unsubscribePayments = onSnapshot(paymentsQ, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentItem)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `events/${event.id}/payments`);
    });

    return () => {
      unsubscribeArts();
      unsubscribePayments();
    };
  }, [event.id]);

  const doneArts = arts.filter(a => a.status === 'done').length;
  const totalArts = arts.length;
  const progress = totalArts > 0 ? (doneArts / totalArts) * 100 : 0;

  const paidAmount = payments.filter(p => p.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const nextPayment = payments
    .filter(p => p.status === 'pending')
    .sort((a, b) => (a.dueDate?.seconds || 0) - (b.dueDate?.seconds || 0))[0];

  return (
    <div className="space-y-8 p-6">
      {/* Hero Card */}
      <div className="relative overflow-hidden glass-card rounded-[2rem] p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600 rounded-full blur-[100px] opacity-10 -mr-48 -mt-48 transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-600 rounded-full blur-[100px] opacity-10 -ml-48 -mb-48 transition-all duration-1000"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-40 h-40 rounded-3xl bg-white/5 backdrop-blur-md p-3 border border-white/20 shadow-2xl shrink-0 overflow-hidden group">
            <img src={event.logoUrl} alt={event.name} className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-transform group-hover:scale-110" />
          </div>
          <div className="text-center md:text-left space-y-3">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-slate-400">
              {event.name}
            </h2>
            <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
              <span className="bg-white/5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 text-slate-300">
                {event.status}
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                {Math.round(progress)}% Concluído
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full md:w-80 space-y-5 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fluxo de Produção</span>
            <span className="text-2xl font-black text-white">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
            />
          </div>
          <p className="text-[11px] text-slate-500 italic flex items-center justify-between">
            <span>{doneArts} de {totalArts} artes finalizadas</span>
            <span className="font-bold text-pink-400 uppercase tracking-tighter underline cursor-pointer">Ver Relatório</span>
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Artes" 
          value={totalArts} 
          icon={<Palette className="w-5 h-5 text-pink-400" />} 
          subtitle="Cronograma ativo"
        />
        <StatCard 
          title="Em Produção" 
          value={arts.filter(a => a.status === 'in-progress').length} 
          icon={<Clock className="w-5 h-5 text-amber-400" />} 
          subtitle="Fila de criação"
          color="amber"
        />
        <StatCard 
          title="Investimento" 
          value={`R$ ${paidAmount.toLocaleString()}`} 
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} 
          subtitle="Total já realizado"
          color="emerald"
        />
        <StatCard 
          title="Próxima Parcela" 
          value={nextPayment ? `R$ ${nextPayment.amount.toLocaleString()}` : "Nenhuma"} 
          icon={<CreditCard className="w-5 h-5 text-purple-400" />} 
          subtitle={nextPayment ? format(nextPayment.dueDate.toDate(), "dd/MM/yyyy", { locale: ptBR }) : "--"}
          color="purple"
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[2.5rem] border-white/5 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden group border">
          <CardHeader className="bg-white/5 border-b border-white/5 p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center text-pink-400">
              <Clock className="mr-3 w-5 h-5" />
              Artes Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {arts.slice(0, 5).map(art => (
                <div key={art.id} className="p-5 flex items-center justify-between hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Palette className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white tracking-tight">{art.title}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">{art.category} • {art.priority}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-4 py-1 rounded-full font-black uppercase tracking-widest border ${
                    art.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    art.status === 'review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-white/5 text-slate-400 border-white/10'
                  }`}>
                    {art.status}
                  </span>
                </div>
              ))}
              {arts.length === 0 && (
                <div className="p-12 text-center text-slate-500 italic font-medium">Nenhuma arte cadastrada.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-white/5 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden border">
          <CardHeader className="bg-white/5 border-b border-white/5 p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center text-emerald-400">
              <CreditCard className="mr-3 w-5 h-5" />
              Saúde Financeira
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-8">
              <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full" />
                <div className="relative z-10">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Confirmado</p>
                  <p className="text-3xl font-black text-white tracking-tighter">R$ {(paidAmount + pendingAmount).toLocaleString()}</p>
                </div>
                <div className="relative z-10 text-right">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Pendente</p>
                  <p className="text-3xl font-black text-pink-500 tracking-tighter">R$ {pendingAmount.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-5">
                <p className="text-[11px] font-black text-slate-200 uppercase tracking-widest flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-emerald-400" />
                  Próximos Compromissos
                </p>
                <div className="space-y-4">
                  {payments.filter(p => p.status === 'pending').slice(0, 3).map(p => (
                    <div key={p.id} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 transition-all hover:bg-white/10 group">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 text-xs font-black">
                          {format(p.dueDate.toDate(), "dd")}
                        </div>
                        <span className="text-sm font-bold text-slate-300">Parcela {format(p.dueDate.toDate(), "MMMM", { locale: ptBR })}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">R$ {p.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest transition-colors group-hover:text-pink-400">Vence em {format(p.dueDate.toDate(), "dd/MM")}</p>
                      </div>
                    </div>
                  ))}
                  {payments.filter(p => p.status === 'pending').length === 0 && (
                    <div className="py-8 text-center text-emerald-400 font-black tracking-widest border border-emerald-500/20 rounded-2xl bg-emerald-500/5">
                      HISTÓRICO LIMPO ✅
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle, color = "zinc" }: any) {
  return (
    <Card className="rounded-[2rem] border-white/5 bg-white/5 backdrop-blur-md shadow-2xl hover:shadow-pink-500/10 transition-all duration-300 group border">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-pink-500 group-hover:text-white transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]">
            {icon}
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
        <p className="text-[10px] text-slate-400 mt-2 font-bold italic opacity-60 group-hover:opacity-100 transition-opacity">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
