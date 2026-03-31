"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentPatients } from "@/components/dashboard/RecentPatients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, MessageSquare, Clock, Crown, Shield } from "lucide-react";

const API_URL = import.meta.env.DEV ? "http://localhost:10001" : "https://patient-backend-olyv.onrender.com";

interface Appointment {
  _id: string;
  patientName: string;
  date: string;
  time: string;
  reason?: string;
  status: string;
}

interface DashboardStats {
  premiumPatients: number;
  plusCount: number;
  proCount: number;
  todayAppointments: number;
  totalAppointments: number;
  unreadMessages: number;
}

export default function Dashboard() {
  const [doctorName, setDoctorName] = useState("Doctor");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [doctorId, setDoctorId] = useState("");

  useEffect(() => {
    // Get doctor info from localStorage
    const storedDoctor = localStorage.getItem("doctor");
    if (storedDoctor) {
      try {
        const doc = JSON.parse(storedDoctor);
        setDoctorName(doc.name || "Doctor");
        setDoctorId(doc._id || doc.id || "");
      } catch {
        const storedName = localStorage.getItem("doctorName");
        if (storedName) setDoctorName(storedName);
      }
    }
  }, []);

  useEffect(() => {
    // Fetch dashboard stats
    const statsUrl = doctorId
      ? `${API_URL}/api/doctor/stats?doctorId=${doctorId}`
      : `${API_URL}/api/doctor/stats`;

    fetch(statsUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") setStats(data.stats);
      })
      .catch((err) => console.error("❌ Error fetching stats:", err));

    // Fetch upcoming appointments from patient-backend
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/appointments`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        const appts: Appointment[] = data.appointments || [];
        const now = new Date();
        const upcoming = appts
          .filter((a) => {
            const apptDate = new Date(`${a.date}T${a.time}`);
            return apptDate > now;
          })
          .sort((a, b) => {
            return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
          })
          .slice(0, 5);
        setUpcomingAppointments(upcoming);
      })
      .catch((err) => console.error("❌ Error fetching appointments:", err));
  }, [doctorId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {doctorName}. Here's your patient overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Premium Patients"
          value={stats ? stats.premiumPatients : "..."}
          description="Plus & Pro subscribers"
          icon={Crown}
        />
        <StatsCard
          title="Today's Appointments"
          value={stats ? stats.todayAppointments : "..."}
          description="Scheduled for today"
          icon={Calendar}
        />
        <StatsCard
          title="Unread Messages"
          value={stats ? stats.unreadMessages : "..."}
          description="Patient communications"
          icon={MessageSquare}
        />
        <StatsCard
          title="Total Appointments"
          value={stats ? stats.totalAppointments : "..."}
          description="All time bookings"
          icon={Clock}
        />
      </div>

      {/* Plan Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plus Patients</p>
                <p className="text-2xl font-bold text-blue-500">{stats.plusCount}</p>
              </div>
              <Badge className="ml-auto bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Plus</Badge>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pro Patients</p>
                <p className="text-2xl font-bold text-amber-500">{stats.proCount}</p>
              </div>
              <Badge className="ml-auto bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Pro</Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentPatients />
        </div>

        <div className="space-y-6">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appt) => (
                    <div
                      key={appt._id}
                      className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">
                            {appt.patientName || "Unknown Patient"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appt.time} - {appt.reason || "Consultation"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        {formatDate(appt.date)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
