import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from "./ui/card";
import { Slider } from "./ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";
import { Users, MessageCircle, HeartPulse, Briefcase, Plus, X, Clock, MapPin, Percent } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type Unit = 'min' | 'km' | '%';

interface Action {
  id: string;
  label: string;
  value: number; 
  unit: Unit;
  weight: number; 
}

interface Pillar {
  id: string;
  label: string;
  icon: any;
  color: string;
  actions: Action[];
}

const INITIAL_PILLARS: Pillar[] = [
  {
    id: "familia",
    label: "Família",
    icon: Users,
    color: "text-orange-500",
    actions: [
      { id: "f1", label: "Qualidade de Tempo", value: 50, unit: '%', weight: 1 },
    ]
  },
  {
    id: "amigos",
    label: "Amigos",
    icon: MessageCircle,
    color: "text-purple-500",
    actions: [
      { id: "a1", label: "Socialização", value: 30, unit: '%', weight: 1 },
    ]
  },
  {
    id: "saude",
    label: "Saúde Física",
    icon: HeartPulse,
    color: "text-green-500",
    actions: [
      { id: "s1", label: "Exercício", value: 40, unit: 'km', weight: 0.7 },
      { id: "s2", label: "Alimentação", value: 60, unit: '%', weight: 0.3 },
    ]
  },
  {
    id: "trabalho",
    label: "Trabalho / Estudo",
    icon: Briefcase,
    color: "text-cyan-500",
    actions: [
      { id: "t1", label: "ADS / Lógica", value: 45, unit: 'min', weight: 0.6 },
      { id: "t2", label: "IA / Prompt", value: 15, unit: 'min', weight: 0.4 },
    ]
  }
];

const SpinOffView = () => {
  const [pillars, setPillars] = useState<Pillar[]>(INITIAL_PILLARS);
  const [newActionLabel, setNewActionLabel] = useState("");
  const [newActionUnit, setNewActionUnit] = useState<Unit>('%');

  const updateActionValue = (pillarId: string, actionId: string, value: number) => {
    setPillars(prev => prev.map(p => {
      if (p.id !== pillarId) return p;
      return {
        ...p,
        actions: p.actions.map(a => a.id === actionId ? { ...a, value } : a)
      };
    }));
  };

  const addAction = (pillarId: string) => {
    if (!newActionLabel.trim()) return;
    setPillars(prev => prev.map(p => {
      if (p.id !== pillarId) return p;
      return {
        ...p,
        actions: [...p.actions, { 
          id: Math.random().toString(36).substr(2, 9), 
          label: newActionLabel, 
          value: newActionUnit === 'km' ? 5 : newActionUnit === 'min' ? 30 : 50, 
          unit: newActionUnit,
          weight: 0.5 
        }]
      };
    }));
    setNewActionLabel("");
  };

  const removeAction = (pillarId: string, actionId: string) => {
    setPillars(prev => prev.map(p => {
      if (p.id !== pillarId) return p;
      return {
        ...p,
        actions: p.actions.filter(a => a.id !== actionId)
      };
    }));
  };

  const calculateIntensity = (pillarId: string) => {
    const pillar = pillars.find(p => p.id === pillarId);
    if (!pillar || pillar.actions.length === 0) return 0;
    
    const weightedSum = pillar.actions.reduce((acc, a) => {
      let normalizedValue = 0;
      if (a.unit === '%') normalizedValue = a.value / 100;
      else if (a.unit === 'min') normalizedValue = Math.min(a.value / 120, 1);
      else if (a.unit === 'km') normalizedValue = Math.min(a.value / 10, 1);
      
      return acc + (normalizedValue * a.weight);
    }, 0);
    
    const totalWeight = pillar.actions.reduce((acc, a) => acc + a.weight, 0);
    return Math.min(weightedSum / totalWeight, 1);
  };

  const intensities = {
    familia: calculateIntensity("familia"),
    amigos: calculateIntensity("amigos"),
    saude: calculateIntensity("saude"),
    trabalho: calculateIntensity("trabalho"),
  };

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dia = i + 1;
      return {
        name: `Dia ${dia}`,
        trabalho: intensities.trabalho * 100 * dia / 7,
        saude: intensities.saude * 100 * dia / 7,
        familia: intensities.familia * 100 * dia / 7,
        amigos: intensities.amigos * 100 * dia / 7,
      };
    });
  }, [intensities]);

  const getStatus = () => {
    const avg = (intensities.saude + intensities.trabalho + intensities.familia + intensities.amigos) / 4;
    if (avg >= 0.7) return { text: "Protocolo 3/1 ativo: Hardware limpo, Software compilando. Trajetória ideal.", color: "border-green-500" };
    if (intensities.saude < 0.2 && intensities.trabalho > 0.5) return { text: "Cuidado: Sistema superaquecido. Adicione 'Saúde' para evitar burnout.", color: "border-red-500" };
    if (intensities.trabalho < 0.3) return { text: "Atenção: Transição de carreira em standby. Ative o modo 'Trabalho'.", color: "border-orange-500" };
    return { text: "Sistema operando em modo equilibrado. Mantenha a constância.", color: "border-cyan-500" };
  };

  const status = getStatus();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-black tracking-tighter text-foreground uppercase italic">
          Painel de Controle: <span className="text-primary">Temporada Spin-off</span>
        </h1>
        <div className="h-1 w-24 bg-primary/20 mx-auto rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-black/40 backdrop-blur-xl border-white/10 space-y-6">
          <h3 className="text-lg font-bold tracking-tight text-foreground/80 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Configuração de Impulso
          </h3>
          
          <Accordion type="single" collapsible className="space-y-4">
            {pillars.map((pillar) => (
              <AccordionItem key={pillar.id} value={pillar.id} className="border-none bg-white/5 rounded-2xl overflow-hidden px-4 transition-all duration-300 hover:bg-white/10">
                <div className="flex items-center gap-4 py-4">
                  <div className={cn("p-2 rounded-xl bg-black/20", pillar.color)}>
                    <pillar.icon size={20} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-sm font-bold tracking-tight">
                      <span>{pillar.label}</span>
                      <span className={pillar.color}>{Math.round(calculateIntensity(pillar.id) * 100)}%</span>
                    </div>
                    <Progress value={calculateIntensity(pillar.id) * 100} className="h-1.5" />
                  </div>
                  <AccordionTrigger className="hover:no-underline py-0 w-auto" />
                </div>
                
                <AccordionContent className="pb-4 space-y-6">
                  <div className="h-px bg-white/10 mx-2" />
                  <div className="space-y-6">
                    {pillar.actions.map((action) => (
                      <div key={action.id} className="space-y-3 group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {action.unit === 'min' && <Clock size={12} className="text-cyan-500" />}
                            {action.unit === 'km' && <MapPin size={12} className="text-green-500" />}
                            {action.unit === '%' && <Percent size={12} className="text-orange-500" />}
                            {action.label}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary">{action.value}{action.unit}</span>
                            <button 
                              onClick={() => removeAction(pillar.id, action.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                        <Slider 
                          value={[action.value]} 
                          onValueChange={(v) => updateActionValue(pillar.id, action.id, v[0])} 
                          max={action.unit === 'min' ? 120 : action.unit === 'km' ? 15 : 100} 
                          step={action.unit === 'km' ? 0.5 : 1}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex gap-2">
                      <Button 
                        variant={newActionUnit === 'min' ? 'default' : 'outline'} 
                        size="sm" 
                        className="flex-1 h-8 text-[10px]"
                        onClick={() => setNewActionUnit('min')}
                      >
                        <Clock className="w-3 h-3 mr-1" /> MIN
                      </Button>
                      <Button 
                        variant={newActionUnit === 'km' ? 'default' : 'outline'} 
                        size="sm" 
                        className="flex-1 h-8 text-[10px]"
                        onClick={() => setNewActionUnit('km')}
                      >
                        <MapPin className="w-3 h-3 mr-1" /> KMS
                      </Button>
                      <Button 
                        variant={newActionUnit === '%' ? 'default' : 'outline'} 
                        size="sm" 
                        className="flex-1 h-8 text-[10px]"
                        onClick={() => setNewActionUnit('%')}
                      >
                        <Percent className="w-3 h-3 mr-1" /> %
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Nova variável..." 
                        className="h-8 text-xs bg-black/20 border-white/5"
                        value={newActionLabel}
                        onChange={(e) => setNewActionLabel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addAction(pillar.id)}
                      />
                      <Button 
                        size="icon" 
                        className="h-8 w-8 shrink-0 bg-primary/20 hover:bg-primary/40 text-primary" 
                        onClick={() => addAction(pillar.id)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <Card className="p-6 bg-black/40 backdrop-blur-xl border-white/10 flex flex-col justify-center">
          <h3 className="text-lg font-bold tracking-tight text-foreground/80 mb-8 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            Estado do Fogão
          </h3>
          
          <div className="grid grid-cols-2 gap-8 items-center justify-items-center">
            {pillars.map((pillar) => {
              const intensity = calculateIntensity(pillar.id);
              return (
                <div key={pillar.id} className="flex flex-col items-center gap-3 group">
                  <div 
                    className="relative w-20 h-20 rounded-full border-4 border-white/5 transition-all duration-700 flex items-center justify-center"
                    style={{ 
                      backgroundColor: `rgba(255, 152, 0, ${intensity * 0.4})`,
                      boxShadow: `inset 0 0 20px rgba(0,0,0,0.8), 0 0 ${intensity * 40}px rgba(255, 152, 0, 0.9)`,
                      borderColor: intensity > 0.5 ? 'rgba(255, 152, 0, 0.4)' : 'rgba(255,255,255,0.05)'
                    }}
                  >
                    <pillar.icon 
                      size={24} 
                      className={cn(
                        "transition-all duration-700",
                        intensity > 0 ? "text-orange-100" : "text-muted-foreground/30"
                      )} 
                    />
                    {intensity > 0 && (
                      <div 
                        className="absolute bottom-1 w-full h-full rounded-full animate-pulse blur-md"
                        style={{ background: `radial-gradient(circle at bottom, rgba(255,152,0,0.8) 0%, transparent 70%)` }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                    {pillar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-black/40 backdrop-blur-xl border-white/10">
        <h3 className="text-lg font-bold tracking-tight text-foreground/80 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
          Projeção de Trajetória
        </h3>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTrabalho" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00bcd4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSaude" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFamilia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff9800" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff9800" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAmigos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9c27b0" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#9c27b0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="trabalho" name="Trabalho" stroke="#00bcd4" strokeWidth={3} fill="url(#colorTrabalho)" />
              <Area type="monotone" dataKey="saude" name="Saúde" stroke="#4caf50" strokeWidth={3} fill="url(#colorSaude)" />
              <Area type="monotone" dataKey="familia" name="Família" stroke="#ff9800" strokeWidth={2} fill="url(#colorFamilia)" />
              <Area type="monotone" dataKey="amigos" name="Amigos" stroke="#9c27b0" strokeWidth={2} fill="url(#colorAmigos)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className={cn(
        "p-6 text-center text-lg font-bold bg-white/5 backdrop-blur-md rounded-2xl border-l-8 transition-all duration-500",
        status.color
      )}>
        {status.text}
      </div>
    </div>
  );
};

export default SpinOffView;
