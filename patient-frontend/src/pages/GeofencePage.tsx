import HeaderNav from "@/components/HeaderNav";
import GeofenceCheck from "@/components/geofence";

export default function GeofencePage() {
  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <HeaderNav />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
             📍 Advanced Geofencing
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your safe zones and monitor realtime safety alerts. Powered by the Pro Plan.
          </p>
        </div>
        
        <div className="w-full border-2 border-border bg-card rounded-2xl p-6 shadow-xl">
           <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
             Safety & Monitoring System
           </h2>
           <GeofenceCheck />
        </div>
      </div>
    </div>
  );
}
