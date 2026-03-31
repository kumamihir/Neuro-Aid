import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Frown, Meh, Smile } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const moods = [
  { key: "great", label: "Great", icon: Smile },
  { key: "ok", label: "Okay", icon: Meh },
  { key: "low", label: "Low", icon: Frown },
] as const;

type MoodKey = typeof moods[number]["key"];

export default function MoodCheck() {
  const [selected, setSelected] = useState<MoodKey | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem(`mood:${today}`);
    if (saved) setSelected(saved as MoodKey);
  }, []);

  const save = (m: MoodKey) => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`mood:${today}`, m);
    setSelected(m);
    toast({ title: "Mood saved", description: "Thanks for checking in." });
  };

  return (
    <Card aria-labelledby="mood-title">
      <CardHeader>
        <CardTitle id="mood-title">Mood & Wellness Check</CardTitle>
        <CardDescription>How are you feeling today?</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {moods.map((m) => (
            <Button
              key={m.key}
              variant={selected === m.key ? "hero" : "soft"}
              size="lg"
              onClick={() => save(m.key)}
              aria-label={`I feel ${m.label}`}
            >
              <m.icon /> {m.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
