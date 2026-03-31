import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Wind, Gamepad2, Layers, ArrowLeft } from "lucide-react";

import HeaderNav from "@/components/HeaderNav";
import SosButton from "@/components/SosButton";
import BrainQuizCard from "@/components/BrainQuiz"; 
import MeditationCard from "@/components/BreathingMeditation"; 
import TicTacToe from "@/components/tictactoe";
import MemoryMatch from "@/components/MemoryMatch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const activities = [
  { id: "quiz", title: "Brain Quiz", desc: "Test your knowledge and memory.", icon: <Brain className="w-10 h-10 text-blue-500" /> },
  { id: "breathe", title: "Meditation & Breathing", desc: "Relax with guided breathing.", icon: <Wind className="w-10 h-10 text-emerald-500" /> },
  { id: "tictactoe", title: "Tic Tac Toe", desc: "A classic game to keep the mind sharp.", icon: <Gamepad2 className="w-10 h-10 text-orange-500" /> },
  { id: "memory", title: "Memory Match", desc: "Flip cards to find matching pairs.", icon: <Layers className="w-10 h-10 text-purple-500" /> },
];

export default function EngagementSection() {
  const navigate = useNavigate();
  const [activeTask, setActiveTask] = useState<string | null>(null);

  const renderActiveTask = () => {
    switch(activeTask) {
      case "quiz": return <BrainQuizCard />;
      case "breathe": return <MeditationCard />;
      case "tictactoe": return <TicTacToe />;
      case "memory": return (
        <Card className="w-full h-full shadow-lg">
          <CardHeader>
            <CardTitle>Memory Match</CardTitle>
            <CardDescription>Flip cards to find matching pairs.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center p-6">
            <MemoryMatch />
          </CardContent>
        </Card>
      );
      default: return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-secondary/30 text-foreground font-sans">
      <HeaderNav />

      <div className="container mx-auto max-w-6xl mt-6 px-4 pb-24">
        
        {!activeTask ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">🧠 Daily Engagement</h1>
              <p className="text-lg text-muted-foreground">Keep your mind active and relaxed with these curated exercises. Select an activity to start.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activities.map((activity) => (
                <Card key={activity.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card border-border border-2">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-muted p-4 rounded-2xl">{activity.icon}</div>
                    <div>
                      <CardTitle className="text-2xl">{activity.title}</CardTitle>
                      <CardDescription className="text-base mt-1">{activity.desc}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardFooter>
                    <Button size="lg" className="w-full text-lg font-semibold py-6 rounded-xl shadow-md" onClick={() => setActiveTask(activity.id)}>
                      Start Activity
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="w-full animate-in fade-in zoom-in-95 duration-300">
            <Button variant="outline" size="lg" className="mb-6 flex items-center gap-2 border-2 hover:bg-muted" onClick={() => setActiveTask(null)}>
              <ArrowLeft className="w-5 h-5" /> Back to Activities
            </Button>
            <div className="w-full flex flex-col items-center justify-center">
               {renderActiveTask()}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6">
        <SosButton />
      </div>
    </div>
  );
}
