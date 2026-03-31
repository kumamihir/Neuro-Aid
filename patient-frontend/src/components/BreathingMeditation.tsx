import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BreathingMeditation() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("Breathe In");
  const [circleSize, setCircleSize] = useState("h-28 w-28"); 
  const [countdown, setCountdown] = useState(3); 
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;

    let step = 0;

    setCircleSize("h-28 w-28");
    setPhase("Breathe In");
    setCountdown(3);

    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 3));
    }, 1000);

    timerRef.current = window.setInterval(() => {
      step = (step + 1) % 4;

      if (step === 0) {
        setPhase("Breathe In");
        setCircleSize("h-40 w-40");
      }
      if (step === 1) {
        setPhase("Hold");
      }
      if (step === 2) {
        setPhase("Breathe Out");
        setCircleSize("h-20 w-20");
      }
      if (step === 3) {
        setPhase("Hold");
      }

      setCountdown(3); 
    }, 3000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, [running]);

  return (
    <Card aria-labelledby="meditation-title">
      <CardHeader>
        <CardTitle id="meditation-title">Meditation</CardTitle>
        <CardDescription>Guided 3-3-3-3 breathing for relaxation.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div
            className={`${circleSize} rounded-full border-4 border-primary/30 transition-all duration-1000 ease-in-out flex items-center justify-center text-3xl font-bold`}
          >
            {running ? countdown : ""}
          </div>
          <p className="mt-3 text-xl">{running ? phase : "Ready"}</p>
          <Button
            className="mt-4"
            variant={running ? "destructive" : "hero"}
            onClick={() => {
              setRunning(!running);
              setPhase("Breathe In");
              setCircleSize("h-28 w-28");
              setCountdown(3);
            }}
            aria-label="Start or stop meditation"
          >
            {running ? "Stop" : "Start"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
