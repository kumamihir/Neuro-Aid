import { Button } from "@/components/ui/button";
import { PhoneCall, Siren } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function SosButton() {
  const handleClick = () => {
    toast({
      title: "SOS triggered",
      description: "We are contacting your emergency contacts now.",
    });
    window.location.href = "tel:112";
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Button
        variant="sos"
        size="xl"
        className="shadow-lg"
        onClick={handleClick}
        aria-label="SOS emergency button"
      >
        <Siren /> SOS
      </Button>
      <div className="mt-2 flex items-center justify-end gap-2 text-sm text-muted-foreground">
        <PhoneCall className="h-4 w-4" />
        <span>Always visible</span>
      </div>
    </div>
  );
}
