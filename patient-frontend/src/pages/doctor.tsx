import { useState, useEffect } from "react";
import HeaderNav from "@/components/HeaderNav";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Phone, MessageSquare, CalendarPlus, Clock, History, ArrowLeft } from "lucide-react";

type DoctorProps = {
  username?: string;
  userId?: string;
};

type Appointment = {
  id?: string;
  _id?: string;
  username: string;
  date: string;
  time: string;
  reason: string;
  patientName?: string;
};

export default function Doctor({ username }: DoctorProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [lastVisit, setLastVisit] = useState<Appointment | null>(null);

  const storedUsername = typeof window !== "undefined" ? localStorage.getItem("username") : null;
  const finalUsername = storedUsername || username || "Guest";

  useEffect(() => {
    const API_URL = import.meta.env.DEV ? "http://localhost:10001" : "https://patient-backend-olyv.onrender.com";
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/appointments`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((result) => {
        const data: Appointment[] = result.appointments || result || [];
        setAppointments(data);
        if (data.length > 0) {
          const pastVisits = data.filter(
            (appt) => new Date(`${appt.date}T${appt.time}`) < new Date()
          );
          if (pastVisits.length > 0) {
            setLastVisit(pastVisits[pastVisits.length - 1]);
          }
        }
      })
      .catch((err) => console.error("❌ Failed to fetch appointments:", err));
  }, []);

  const handleAppointmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const appointment: Appointment = {
      username: finalUsername,
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      reason: formData.get("reason") as string,
    };

    try {
      const API_URL = import.meta.env.DEV ? "http://localhost:10001" : "https://patient-backend-olyv.onrender.com";
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers,
        body: JSON.stringify(appointment),
      });

      if (!res.ok) throw new Error("Failed to book appointment");

      alert(`✅ Appointment scheduled for ${appointment.date} at ${appointment.time}`);
      setAppointments((prev) => [...prev, appointment]);
      setActiveTab(null); // Return to hub
    } catch (err) {
      console.error(err);
      alert("❌ Could not book appointment.");
    }
  };

  const handleDelete = async (id?: string, idx?: number) => {
    const deleteId = id;
    if (!deleteId && idx === undefined) return;
    try {
      if (deleteId) {
        const API_URL = import.meta.env.DEV ? "http://localhost:10001" : "https://patient-backend-olyv.onrender.com";
        const res = await fetch(`${API_URL}/appointments/${deleteId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete appointment");
      }
      setAppointments((prev) => prev.filter((_, i) => (idx !== undefined ? i !== idx : true)));
    } catch (err) {
      console.error(err);
      alert("❌ Could not delete appointment.");
    }
  };

  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 7; hour <= 20; hour++) {
      times.push(`${hour.toString().padStart(2, "0")}:00`);
      if (hour !== 20) times.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return times;
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case "contact":
        return (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
            <h2 className="text-3xl font-bold mb-4">Personal Doctor Contact</h2>
            <Card className="shadow-lg border-2">
              <CardContent className="p-8 flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Doctor" alt="Doctor avatar" className="w-20 h-20 rounded-full" />
                </div>
                <div className="text-center">
                   <h3 className="text-2xl font-semibold">Dr. Sarah Johnson</h3>
                   <p className="text-muted-foreground mt-1">Neurologist & Primary Care</p>
                </div>
                <div className="flex flex-col w-full gap-4 mt-4">
                  <Button asChild size="lg" className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md">
                    <a href="tel:+1234567890"><Phone className="mr-2 h-6 w-6" /> Call Doctor Now</a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full text-lg py-6 rounded-xl shadow-sm border-2">
                    <a href="sms:+1234567890"><MessageSquare className="mr-2 h-6 w-6" /> Send a Message</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "schedule":
        return (
          <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95">
            <h2 className="text-3xl font-bold mb-6">Schedule Appointment</h2>
            <Card className="shadow-lg border-2">
              <CardContent className="p-6">
                <form onSubmit={handleAppointmentSubmit} className="flex flex-col gap-5">
                  <input type="hidden" name="username" value={finalUsername} />
                  <label className="flex flex-col gap-2">
                    <span className="font-semibold text-lg">Select Date</span>
                    <input type="date" name="date" min={new Date().toISOString().split("T")[0]} required className="border-2 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background" />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="font-semibold text-lg">Select Time</span>
                    <select name="time" required className="border-2 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background max-h-60 overflow-y-auto">
                      {generateTimeOptions().map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="font-semibold text-lg">Reason for Visit</span>
                    <textarea name="reason" placeholder="e.g. Routine checkup, memory issues..." required className="border-2 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background min-h-[100px]" rows={3} />
                  </label>
                  <Button type="submit" size="lg" className="mt-4 w-full py-6 text-lg rounded-xl shadow-md">Confirm Appointment</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        );

      case "upcoming":
        return (
          <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95">
            <h2 className="text-3xl font-bold mb-6">Upcoming Appointments</h2>
            <Card className="shadow-lg border-2 bg-gradient-to-b from-card to-secondary/10">
              <CardContent className="p-6">
                {appointments.length > 0 ? (
                  <ul className="space-y-4">
                    {appointments.map((appt, idx) => (
                      <li key={appt._id || appt.id || idx} className="p-5 border-2 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                               <CalendarPlus className="text-emerald-500 w-5 h-5"/>
                               <p className="font-bold text-xl text-foreground">{appt.date} at {appt.time}</p>
                            </div>
                            <p className="text-muted-foreground text-md font-medium">{appt.reason}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-4 py-2 rounded-full">
                              Upcoming Visit
                            </span>
                            <button onClick={() => handleDelete(appt._id || appt.id, idx)} className="p-3 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="Cancel Appointment">
                              <Trash2 className="w-6 h-6 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-12">
                     <Clock className="mx-auto w-16 h-16 text-muted-foreground/30 mb-4" />
                     <p className="text-xl text-muted-foreground font-medium">You have no upcoming appointments.</p>
                     <Button variant="outline" className="mt-6" onClick={() => setActiveTab("schedule")}>Schedule One Now</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "history":
        return (
          <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95">
            <h2 className="text-3xl font-bold mb-6">Visit History</h2>
            <Card className="shadow-lg border-2">
              <CardContent className="p-6">
                {lastVisit ? (
                  <div className="p-6 border-2 rounded-2xl bg-muted/30">
                    <p className="text-foreground text-lg mb-2">Your last documented visit was:</p>
                    <p className="text-2xl font-bold mb-2 text-primary">{lastVisit.date} at {lastVisit.time}</p>
                    <p className="text-lg text-muted-foreground">Reason: {lastVisit.reason}</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                     <History className="mx-auto w-16 h-16 text-muted-foreground/30 mb-4" />
                     <p className="text-xl text-muted-foreground font-medium">No past visits recorded.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <HeaderNav />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!activeTab ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">🩺 Doctor & Appointments</h1>
              <p className="text-lg text-muted-foreground">Manage your clinic visits and contact your personal doctor.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Card */}
              <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card border-border border-2 cursor-pointer" onClick={() => setActiveTab("contact")}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl"><Phone className="w-10 h-10 text-blue-600 dark:text-blue-400" /></div>
                    <div>
                      <CardTitle className="text-2xl">Contact Doctor</CardTitle>
                      <CardDescription className="text-base mt-1">Call or message directly</CardDescription>
                    </div>
                  </CardHeader>
                  <CardFooter>
                    <Button size="lg" className="w-full text-lg font-semibold py-6 rounded-xl shadow-sm bg-muted text-foreground hover:bg-muted/80">Open Menu</Button>
                  </CardFooter>
              </Card>

              {/* Schedule Card */}
              <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card border-border border-2 cursor-pointer" onClick={() => setActiveTab("schedule")}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-2xl"><CalendarPlus className="w-10 h-10 text-emerald-600 dark:text-emerald-400" /></div>
                    <div>
                      <CardTitle className="text-2xl">Schedule Visit</CardTitle>
                      <CardDescription className="text-base mt-1">Book a new appointment</CardDescription>
                    </div>
                  </CardHeader>
                  <CardFooter>
                    <Button size="lg" className="w-full text-lg font-semibold py-6 rounded-xl shadow-sm bg-muted text-foreground hover:bg-muted/80">Open Menu</Button>
                  </CardFooter>
              </Card>

              {/* Upcoming Card - Now rendering directly inline */}
              <Card className="bg-card border-border border-2 flex flex-col">
                  <CardHeader className="flex flex-row items-center gap-4 bg-purple-50 dark:bg-purple-950/20 rounded-t-xl pb-4">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-2xl"><Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" /></div>
                    <div>
                      <CardTitle className="text-xl">Upcoming Visits</CardTitle>
                      <CardDescription className="text-sm mt-1">Pending scheduled dates</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-4 overflow-y-auto max-h-[300px]">
                    {appointments.length > 0 ? (
                      <ul className="space-y-4">
                        {appointments.map((appt, idx) => (
                          <li key={appt._id || appt.id || idx} className="p-4 border border-border rounded-xl bg-muted/20 shadow-sm relative">
                            <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <CalendarPlus className="text-emerald-500 w-4 h-4"/>
                                  <p className="font-bold text-base text-foreground">{appt.date} at {appt.time}</p>
                               </div>
                               <p className="text-muted-foreground text-sm font-medium">{appt.reason}</p>
                            </div>
                            <button onClick={() => handleDelete(appt._id || appt.id, idx)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="Cancel Appointment">
                               <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6">
                         <Clock className="mx-auto w-10 h-10 text-muted-foreground/30 mb-2" />
                         <p className="text-sm text-muted-foreground font-medium">You have no upcoming appointments.</p>
                      </div>
                    )}
                  </CardContent>
              </Card>

              {/* History Card - Now rendering directly inline */}
              <Card className="bg-card border-border border-2 flex flex-col">
                  <CardHeader className="flex flex-row items-center gap-4 bg-orange-50 dark:bg-orange-950/20 rounded-t-xl pb-4">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-2xl"><History className="w-8 h-8 text-orange-600 dark:text-orange-400" /></div>
                    <div>
                      <CardTitle className="text-xl">Past Visits</CardTitle>
                      <CardDescription className="text-sm mt-1">Check logs of last visit</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-4">
                    {lastVisit ? (
                      <div className="p-4 border border-border rounded-xl bg-muted/20">
                        <p className="text-foreground text-sm mb-1">Your last documented visit was:</p>
                        <p className="text-lg font-bold mb-2 text-primary">{lastVisit.date} at {lastVisit.time}</p>
                        <p className="text-sm text-muted-foreground">Reason: {lastVisit.reason}</p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                         <History className="mx-auto w-10 h-10 text-muted-foreground/30 mb-2" />
                         <p className="text-sm text-muted-foreground font-medium">No past visits recorded.</p>
                      </div>
                    )}
                  </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div>
            <Button variant="outline" size="lg" className="mb-6 flex items-center gap-2 border-2 hover:bg-muted" onClick={() => setActiveTab(null)}>
              <ArrowLeft className="w-5 h-5" /> Back to Doctor Hub
            </Button>
            {renderActiveScreen()}
          </div>
        )}
      </div>
    </div>
  );
}
