import { useState, useEffect } from "react";
import { CheckCircle2, ShieldAlert, Sparkles, X, Activity, BrainCircuit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredPlan: "Plus" | "Pro";
  featureName: string;
}

export default function PremiumUpgradeModal({ isOpen, onClose, requiredPlan, featureName }: PremiumUpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] border-2 border-emerald-500/20 bg-background shadow-2xl overflow-hidden rounded-3xl p-0">
        
        {/* Header Section with Image/Gradient */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-8 text-primary-foreground relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/20 hover:bg-black/40 p-1.5 rounded-full">
            <X className="w-5 h-5" />
          </button>
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-md shadow-inner">
               <ShieldAlert className="w-12 h-12 text-white" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-extrabold text-center tracking-tight text-white mb-2">
            Unlock {featureName}
          </DialogTitle>
          <DialogDescription className="text-center text-emerald-50 font-medium text-lg">
            This is a premium feature. Upgrade to {requiredPlan} to access it!
          </DialogDescription>
        </div>

        {/* Comparison Section */}
        <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="grid md:grid-cols-2 gap-6 relative">
            
            {/* Divider */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

            {/* Basic Plan Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-muted-foreground flex items-center gap-2">
                Your Current Plan: Basic
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Basic Engagement Suite
                </li>
                <li className="flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Reminders & Notifications
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground line-through opacity-70">
                  <X className="w-4 h-4 text-red-400" /> Doctor Consultations
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground line-through opacity-70">
                  <X className="w-4 h-4 text-red-400" /> Advanced Geofencing
                </li>
              </ul>
            </div>

            {/* Upgrade Plan Info */}
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> The {requiredPlan} Experience
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 24/7 Doctor Consultations
                </li>
                <li className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Live GPS Geofencing (Pro)
                </li>
                <li className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Immediate Medical Support
                </li>
                <li className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Priority Alerts & Care
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Button size="lg" className="w-full text-lg py-6 shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1 transition-all rounded-xl">
              Upgrade to {requiredPlan} Now
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              By upgrading, you agree to our awesome Terms & Conditions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
