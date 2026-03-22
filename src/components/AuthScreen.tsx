import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LogIn, UserPlus, Mail, ShieldCheck, LogOut, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, logout, sendVerification } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Bem-vindo de volta!");
      } else {
        await signUp(email, password);
        toast.success("Conta criada! Enviamos um link de verificação para seu e-mail.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await sendVerification();
      toast.success("E-mail de verificação reenviado!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // If user is logged in but NOT verified
  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
        <div className="absolute top-8 right-8">
            <ThemeToggle />
        </div>
        <div className="max-w-md w-full glass-card p-10 rounded-[2.5rem] border-white/5 shadow-2xl bg-secondary/30 backdrop-blur-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-black tracking-tight text-foreground dark:text-white italic">Verifique seu e-mail</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Enviamos um link de confirmação para <b>{user.email}</b>. 
              Por favor, verifique sua caixa de entrada (e o spam) para ativar sua conta.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-3 pt-4">
            <Button 
                onClick={() => window.location.reload()} 
                className="rounded-full h-12 bg-white text-black font-black uppercase hover:scale-[1.02] transition-all"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Já verifiquei
            </Button>
            <Button variant="ghost" onClick={handleResend} className="text-slate-400 hover:text-white">
              Reenviar e-mail
            </Button>
            <Button variant="ghost" onClick={logout} className="text-destructive/70 hover:text-destructive flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 relative">
      <div className="absolute top-8 right-8">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full glass-card p-10 rounded-[2.5rem] border-white/5 shadow-2xl bg-secondary/30 backdrop-blur-2xl space-y-8">
        <div className="text-center space-y-2">
          <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-12 group-hover:rotate-0 transition-transform">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-black tracking-tighter text-foreground dark:text-white uppercase italic">
            LifeOS <span className="text-primary">PRO</span>
          </h2>
          <p className="text-slate-500 text-xs font-black tracking-widest uppercase">
            {isLogin ? "Acesse sua conta segura" : "Crie sua conta profissional"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">E-mail</label>
            <Input
              type="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/20 border-white/5 rounded-2xl h-14 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-white placeholder:text-slate-600 outline-none"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Senha</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/20 border-white/5 rounded-2xl h-14 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-white placeholder:text-slate-600 outline-none"
              required
            />
          </div>

          <Button 
            disabled={loading}
            className="w-full h-14 rounded-full bg-white text-black font-black uppercase tracking-widest text-xs hover:scale-[1.05] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? <RefreshCcw className="h-5 w-5 animate-spin" /> : isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            <span>{isLogin ? "Entrar" : "Criar Conta"}</span>
          </Button>
        </form>

        <div className="text-center pt-4">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-black tracking-widest text-slate-400 uppercase hover:text-primary transition-colors"
          >
            {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem conta? Entre aqui"}
          </button>
        </div>
      </div>
    </div>
  );
};
