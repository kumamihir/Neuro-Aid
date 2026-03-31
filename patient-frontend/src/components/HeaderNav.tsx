import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { HeartPulse, Phone, Home, Brain, User, Stethoscope, LogOut, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

export default function HeaderNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState<"Plus" | "Pro">("Plus");
  const [modalFeature, setModalFeature] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNav = (path: string, requiredPlan?: "Plus" | "Pro") => {
    const currentPlan = user?.subscriptionPlan || "Basic";
    
    if (requiredPlan === "Pro" && currentPlan !== "Pro") {
      setModalPlan("Pro");
      setModalFeature(path === "/geofence" ? "Advanced Geofencing" : "Premium Feature");
      setModalOpen(true);
      return;
    }

    if (requiredPlan === "Plus" && currentPlan === "Basic") {
      setModalPlan("Plus");
      setModalFeature("Doctor Consultations");
      setModalOpen(true);
      return;
    }

    navigate(path);
  };

  return (
    <>
      <PremiumUpgradeModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        requiredPlan={modalPlan} 
        featureName={modalFeature} 
      />
      <header className="sticky top-0 z-40 w-full border-b-2 border-primary/10 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md shadow-sm transition-colors duration-300">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          {/* Left Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer transition-transform hover:scale-105"
            onClick={() => handleNav("/app")}
          >
            <HeartPulse className="h-8 w-8 text-primary" aria-hidden="true" />
            <span className="text-2xl font-bold text-foreground tracking-tight">NEURO-AID</span>
          </div>

          {/* Nav Bar */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              onClick={() => handleNav("/app")}
              className="flex items-center gap-2 text-foreground font-medium hover:text-primary hover:bg-primary/10"
            >
              <Home className="h-4 w-4" /> Home
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleNav("/engagement")}
              className="flex items-center gap-2 text-foreground font-medium hover:text-primary hover:bg-primary/10"
            >
              <Brain className="h-4 w-4" /> Engagement
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleNav("/doctor", "Plus")}
              className="flex items-center gap-2 text-foreground font-medium hover:text-primary hover:bg-primary/10"
            >
              <Stethoscope className="h-4 w-4" /> Doctor
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleNav("/geofence", "Pro")}
              className="flex items-center gap-2 text-foreground font-medium hover:text-primary hover:bg-primary/10"
            >
              <MapPin className="h-4 w-4" /> Geofence
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleNav("/chat", "Plus")}
              className="flex items-center gap-2 text-foreground font-medium hover:text-primary hover:bg-primary/10"
            >
              <MessageCircle className="h-4 w-4" /> Messages
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleNav("/profile")}
              className="flex items-center gap-2 text-foreground font-medium hover:text-primary hover:bg-primary/10"
            >
              <User className="h-4 w-4" /> Profile
            </Button>
          </nav>

          {/* Right Side: Doctor Call, Logout, ThemeToggle */}
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="default"
              size="sm"
              onClick={(e) => {
                 e.preventDefault();
                 handleNav("/doctor", "Plus");
              }}
              aria-label="Call personal doctor"
              className="hidden sm:flex bg-primary cursor-pointer text-primary-foreground hover:bg-primary/90 transition transform hover:scale-105 shadow-md"
            >
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> Doctor
              </div>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive transition transform hover:scale-110"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
    </>
  );
}
