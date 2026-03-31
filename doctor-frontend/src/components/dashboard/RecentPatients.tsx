import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Calendar, Eye, Crown, Shield, RefreshCw } from "lucide-react";

const API_URL = import.meta.env.DEV ? "http://localhost:10001" : "https://patient-backend-olyv.onrender.com";

interface Patient {
  _id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  phone: string;
  condition: string;
  ongoingTreatment: string;
  lastVisit: string;
  status: "stable" | "attention" | "critical" | "new";
  subscriptionPlan: "Basic" | "Plus" | "Pro";
  bloodGroup: string;
}

const getStatusColor = (status: Patient["status"]) => {
  switch (status) {
    case "stable":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "attention":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "critical":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    default:
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  }
};

const getPlanBadge = (plan: string) => {
  if (plan === "Pro") {
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 hover:bg-amber-500/20">
        <Crown className="h-3 w-3" /> Pro
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1 hover:bg-blue-500/20">
      <Shield className="h-3 w-3" /> Plus
    </Badge>
  );
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function RecentPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/doctor/patients/recent`);
      const data = await res.json();
      if (data.status === "ok") {
        setPatients(data.patients);
      }
    } catch (error) {
      console.error("Error fetching recent patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          Recent Premium Patients
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchPatients} className="gap-1">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = "/patients"}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : patients.length > 0 ? (
          <div className="space-y-3">
            {patients.map((patient) => (
              <div
                key={patient._id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(patient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{patient.name}</p>
                      {getPlanBadge(patient.subscriptionPlan)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {patient.age ? `Age ${patient.age}` : ""}{patient.age && patient.condition ? " • " : ""}{patient.condition || patient.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Badge variant="outline" className={`text-xs ${getStatusColor(patient.status)}`}>
                      {patient.status || "new"}
                    </Badge>
                    {patient.lastVisit && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(patient.lastVisit).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Message" onClick={() => window.location.href = "/messages"}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Schedule" onClick={() => window.location.href = "/appointments"}>
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Crown className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No premium patients yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Patients with Plus or Pro plans will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
