import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const getUserProfile = () => {
  const data = localStorage.getItem("userProfile");
  return data
    ? JSON.parse(data)
    : { name: "Mihir", age: null, condition: null }; // 👈 name changed to Mihir
};

const getOfflineReply = (message: string) => {
  const lowerMsg = message.toLowerCase();
  const user = getUserProfile();

  if (lowerMsg.includes("headache")) {
    return `${user.name}, for a mild headache, try resting in a quiet room and drink water. If pain persists, consult your doctor.`;
  }

  if (
    lowerMsg.includes("can't sleep") || 
    lowerMsg.includes("insomnia") || 
    lowerMsg.includes("sleep at night")
  ) {
    return `${user.name}, try avoiding screens before bedtime, keep your room dark and calm. If the problem continues, discuss with a doctor.`;
  }

  if (
    lowerMsg.includes("don't feel like eating") || 
    lowerMsg.includes("no appetite") || 
    lowerMsg.includes("not eating") || 
    lowerMsg.includes("eat")
  ) {
    return `${user.name}, loss of appetite can sometimes be due to stress or illness. Try small frequent meals and consult your doctor if it continues.`;
  }

  if (lowerMsg.includes("anxiety") || lowerMsg.includes("anxious") || lowerMsg.includes("nervous")) {
    return `${user.name}, when you feel anxious, try deep breathing, grounding exercises, or talking to someone you trust. If anxiety persists, please consult a mental health professional.`;
  }

  return `I'm here for you ${user.name}. Can you tell me your symptoms?`;
};

const speakText = (text: string) => {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }
};

export default function VoiceChat() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [botReply, setBotReply] = useState(""); // subtitles
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onresult = async (event: any) => {
        const last = event.results.length - 1;
        const spokenText = event.results[last][0].transcript;
        setTranscript(spokenText);
        recognition.stop();
        setListening(false);

        setIsProcessing(true);
        try {
          const reply = getOfflineReply(spokenText); // 👈 only offline replies
          setBotReply(reply);
          toast({ title: "Bot says", description: reply });
          speakText(reply);
        } finally {
          setIsProcessing(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setListening(false);
        setIsProcessing(false);
        toast({
          title: "Speech recognition error",
          description: event.error,
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        if (listening) setListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [listening]);

  const toggle = async () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support speech recognition.",
      });
      return;
    }

    if (isProcessing) {
      toast({
        title: "Processing",
        description: "Please wait while I process your previous request.",
      });
      return;
    }

    if (!listening) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognition.start();
        setListening(true);
      } catch {
        toast({
          title: "Microphone blocked",
          description: "Please allow microphone access.",
        });
      }
    } else {
      recognition.stop();
      setListening(false);
    }
  };

  return (
    <Card aria-labelledby="voice-chat-title">
      <CardHeader>
        <CardTitle id="voice-chat-title">Voice Chat</CardTitle>
        <CardDescription>AI Health Assistant (Offline)</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant={listening ? "destructive" : "hero"}
          size="lg"
          onClick={toggle}
          aria-label="Toggle voice chat"
          disabled={isProcessing}
        >
          {listening ? <Square /> : <Mic />}
          {listening ? "Stop" : isProcessing ? "Processing..." : "Speak"}
        </Button>

        {/* Show user speech */}
        {transcript && (
          <p className="mt-3 text-lg">
            You said: <span className="font-semibold">{transcript}</span>
          </p>
        )}

        {/* Show bot subtitles */}
        {botReply && (
          <p className="mt-2 text-lg text-blue-600">
            Bot: <span className="font-medium">{botReply}</span>
          </p>
        )}

        {isProcessing && (
          <p className="mt-3 text-sm text-muted-foreground">Thinking...</p>
        )}
      </CardContent>
    </Card>
  );
}
