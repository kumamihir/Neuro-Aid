import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function EmergencyShare() {
  const handleShare = async () => {
    if (!navigator.geolocation) {
      toast({ title: "Location not available" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        const message = `My live location: ${mapsUrl}`;
        try {
          if (navigator.share) {
            await navigator.share({ title: "My Location", text: message, url: mapsUrl });
          } else {
            await navigator.clipboard.writeText(message);
            toast({ title: "Location copied", description: "You can paste it in chat or SMS." });
          }
        } catch (e) {
          await navigator.clipboard.writeText(message);
          toast({ title: "Location copied", description: "You can paste it in chat or SMS." });
        }
      },
      () => toast({ title: "Permission needed", description: "Please allow location access." })
    );
  };

  return (
    <Card aria-labelledby="emergency-share-title">
      <CardHeader>
        <CardTitle id="emergency-share-title" className="text-2xl">Emergency Location Sharing</CardTitle>
        <CardDescription>Quickly share your current location with family or doctors.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="hero" size="lg" onClick={handleShare} aria-label="Share my live location">
          <Share2 /> Share My Live Location
        </Button>
        <p className="mt-3 text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Uses your phone's GPS securely.</p>
      </CardContent>
    </Card>
  );
}
