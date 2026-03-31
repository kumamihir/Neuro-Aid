import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Brain, Stethoscope, HeartPulse, MessageCircle, X, ArrowRight, Activity, CalendarDays } from "lucide-react";

import HeaderNav from "@/components/HeaderNav";
import SosButton from "@/components/SosButton";
import NotificationsPanel from "@/components/NotificationsPanel";

import VoiceChat from "@/components/VoiceChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "../AuthContext";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";

type User = {
  username: string;
  id: string;
};

export default function Home() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isAIOpen, setIsAIOpen] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState<"Plus" | "Pro">("Plus");
  const [modalFeature, setModalFeature] = useState("");

  const handleNav = (path: string, requiredPlan?: "Plus" | "Pro") => {
    const currentPlan = authUser?.subscriptionPlan || "Basic";
    
    if (requiredPlan === "Pro" && currentPlan !== "Pro") {
      setModalPlan("Pro");
      setModalFeature(path === "/geofence" ? "Advanced Geofencing" : "Premium Feature");
      setModalOpen(true);
      return;
    }

    if (requiredPlan === "Plus" && currentPlan === "Basic") {
      setModalPlan("Plus");
      setModalFeature(path === "/doctor" ? "Doctor Consultations" : "Premium Feature");
      setModalOpen(true);
      return;
    }

    navigate(path);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const API_URL = import.meta.env.DEV ? "http://localhost:10001" : "https://patient-backend-olyv.onrender.com";

    fetch(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setUser({
            username: data.user.name,
            id: data.user._id || data.user.id,
          });
        }
      })
      .catch((err) => {
        console.error("Profile fetch failed:", err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-secondary/30 text-foreground font-sans relative pb-20">
      <PremiumUpgradeModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        requiredPlan={modalPlan} 
        featureName={modalFeature} 
      />
      <HeaderNav />

      <main role="main" className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in ease-out duration-500">
        
        {/* HERO BANNER SECTION */}
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-primary to-emerald-600 p-6 md:p-8 text-primary-foreground flex flex-col md:flex-row justify-between items-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
             <HeartPulse className="w-80 h-80 -mt-20 -mr-20" />
          </div>
          <div className="relative z-10 space-y-2 max-w-2xl">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
              Neuro-Aid Plus+
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.username ? user.username.split(" ")[0] : "Friend"} 👋
            </h1>
            <p className="text-base md:text-lg opacity-90 leading-relaxed font-medium">
              Your personalized memory care and health companion.<br className="hidden md:block"/> Let's have a great day today!
            </p>
            <div className="pt-3 flex gap-3">
              <Button className="bg-white text-primary hover:bg-white/90 font-bold shadow-md rounded-xl" onClick={() => navigate("/engagement")}>
                Start Daily Activities
              </Button>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS GRID (Like PharmEasy/Swiggy Cards) */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 px-1 text-foreground">Explore Categories</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="hover:shadow-lg transition-transform hover:-translate-y-1 cursor-pointer border-transparent bg-white dark:bg-zinc-900 overflow-hidden group" onClick={() => navigate("/engagement")}>
              <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-base">Brain Games</h3>
                <p className="text-xs text-muted-foreground">Keep your mind sharp</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-transform hover:-translate-y-1 cursor-pointer border-transparent bg-white dark:bg-zinc-900 overflow-hidden group" onClick={() => handleNav("/doctor", "Plus")}>
              <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-base">My Doctors</h3>
                <p className="text-xs text-muted-foreground">Consult & appointments</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-transform hover:-translate-y-1 cursor-pointer border-transparent bg-white dark:bg-zinc-900 overflow-hidden group" onClick={() => handleNav("/geofence", "Pro")}>
              <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-base">Care Status</h3>
                <p className="text-xs text-muted-foreground">Check your geofence</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-transform hover:-translate-y-1 cursor-pointer border-transparent bg-white dark:bg-zinc-900 overflow-hidden group" onClick={() => navigate("/engagement")}>
              <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-base">Daily Routine</h3>
                <p className="text-xs text-muted-foreground">Meditation & tasks</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* DASHBOARD WIDGETS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* DAILY CHECKLIST */}
          <div className="w-full lg:col-span-1 border-2 border-border bg-card rounded-2xl p-5 shadow-sm">
             <h2 className="text-xl font-bold mb-4 px-1 text-foreground flex items-center gap-2">
               <CalendarDays className="w-5 h-5 text-emerald-500" />
               Daily Routine
             </h2>
             <ul className="space-y-3">
               {[
                 { id: 1, text: "Drink a glass of water" },
                 { id: 2, text: "Take morning medication" },
                 { id: 3, text: "Complete one Brain Game" },
                 { id: 4, text: "Go for a short walk" }
               ].map((task) => (
                 <li key={task.id} className="flex items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border">
                   <div className="flex-shrink-0">
                     <label className="flex items-center cursor-pointer">
                       <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-colors cursor-pointer" />
                     </label>
                   </div>
                   <span className="text-sm font-medium text-foreground">{task.text}</span>
                 </li>
               ))}
             </ul>
             <Button variant="ghost" className="w-full mt-4 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">View All Tasks</Button>
          </div>

          {/* REMINDERS */}
          <div className="w-full lg:col-span-1 border-2 border-border bg-card rounded-2xl p-5 shadow-sm">
             <h2 className="text-xl font-bold mb-4 px-1 text-foreground flex items-center gap-2">Reminders Overview</h2>
             <NotificationsPanel />
          </div>
        </div>
      </main>

      {/* SOS Button Component naturally places itself at bottom-right */}
      <SosButton />

      {/* FLOATING AI SUPER AGENT - Positioned above SOS */}
      <div className="fixed bottom-28 right-5 z-50 flex flex-col items-end">
        {isAIOpen && (
          <div className="mb-4 w-[340px] shadow-2xl rounded-2xl border border-border bg-card overflow-hidden animate-in slide-in-from-bottom-5 fade-in zoom-in-95 duration-300 origin-bottom-right">
            <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2">
                <div className="bg-white p-1.5 rounded-full text-primary">
                  <Brain className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">Neuro Assistant</h3>
                  <p className="text-xs opacity-90">Always here to help you</p>
                </div>
              </div>
              <button onClick={() => setIsAIOpen(false)} className="hover:bg-primary-foreground/20 p-1 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-gradient-to-b from-card to-secondary/30">
              <VoiceChat />
            </div>
          </div>
        )}
        
        <Button 
          onClick={() => setIsAIOpen(!isAIOpen)}
          size="icon"
          className={`h-16 w-16 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border-4 border-background ${isAIOpen ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-primary hover:bg-primary/90 hover:animate-pulse'}`}
        >
          {isAIOpen ? <X className="w-8 h-8 text-white"/> : <MessageCircle className="w-8 h-8 text-white" />}
        </Button>
      </div>

    </div>
  );
}
