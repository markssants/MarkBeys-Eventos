import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  User,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole } from './types';
import { Dashboard } from './components/dashboard/Dashboard';
import { RoleSelection } from './components/auth/RoleSelection';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2, Music, Palette, Calendar } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (loginLoading) return;
    setLoginLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        console.log('Login cancelado pelo usuário');
      } else {
        console.error('Erro no login:', err);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const selectRole = async (role: UserRole) => {
    if (!user) return;
    const newProfile: UserProfile = {
      id: user.uid,
      name: user.displayName || 'User',
      email: user.email || '',
      role,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', user.uid), newProfile);
    setProfile(newProfile);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0518]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-[#0a0518] text-slate-100 overflow-hidden relative font-sans">
      <div className="glow-purple top-[-10%] left-[-10%] w-[40%] h-[40%]" />
      <div className="glow-pink bottom-[10%] right-[-5%] w-[35%] h-[35%]" />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        <Toaster />
        {!user ? (
          <Landing handleLogin={handleLogin} loginLoading={loginLoading} />
        ) : !profile ? (
          <RoleSelection onSelect={selectRole} />
        ) : (
          <Dashboard profile={profile} />
        )}
      </div>
    </div>
  );
}

function Landing({ handleLogin, loginLoading }: { handleLogin: () => void, loginLoading: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8 glass-card p-12 rounded-3xl"
      >
        <div className="flex justify-center space-x-[-12px]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center transform -rotate-12 shadow-xl">
            <Palette className="text-white w-8 h-8" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg z-10 border border-white/20">
            <Calendar className="text-pink-400 w-8 h-8" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center transform rotate-12 shadow-xl">
            <Music className="text-white w-8 h-8" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-200 to-slate-400">
            BEYS ARTS
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Gestão de eventos e artes em um só lugar. Organize presskits, cronogramas e pagamentos com estilo.
          </p>
        </div>

        <Button 
          size="lg" 
          onClick={handleLogin}
          disabled={loginLoading}
          className="w-full h-14 text-lg font-bold bg-pink-500 hover:bg-pink-600 text-white transition-all rounded-2xl shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] border-none group"
        >
          {loginLoading ? (
            <Loader2 className="mr-2 w-5 h-5 animate-spin" />
          ) : (
            <LogIn className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          )}
          {loginLoading ? 'Carregando...' : 'Entrar agora'}
        </Button>
      </motion.div>
    </div>
  );
}
