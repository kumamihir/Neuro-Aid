import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarIcon, Clock, Plus } from "lucide-react";

interface Appointment {
  _id: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: string;
  reason?: string;
  status: "scheduled" | "completed" | "cancelled" | "pending";
  priority: "stable" | "attention" | "critical";
  patientPhoto?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "scheduled": return "bg-primary text-primary-foreground";
    case "completed": return "bg-green-500 text-white";
    case "cancelled": return "bg-red-500 text-white";
    case "pending": return "bg-gray-400 text-white";
    default: return "bg-gray-300 text-gray-800";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "stable": return "bg-green-500 text-white";
    case "attention": return "bg-yellow-500 text-black";
    case "critical": return "bg-red-500 text-white";
    default: return "bg-gray-300 text-gray-800";
  }
};

// ✅ Safer date + time formatter
const formatDateTime = (dateStr: string, timeStr: string) => {
  try {
    let safeTime = timeStr;
    if (timeStr && timeStr.split(":").length === 2) {
      safeTime = `${timeStr}:00`; // add seconds if missing
    }
    const dateObj = new Date(`${dateStr}T${safeTime}`);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return `${dateStr} • ${timeStr}`;
  } catch {
    return `${dateStr} • ${timeStr}`;
  }
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch("https://doctor-backend-b64v.onrender.com/appointments");
        const data = await res.json();

        // ✅ Normalize date + time
        const cleanData = (data.status === "ok" ? data.appointments : data).map(
          (apt: any) => ({
            ...apt,
            date: apt.date ? apt.date.split("T")[0] : "",
            time: apt.time ? apt.time.slice(0, 5) : "",
          })
        );

        setAppointments(cleanData);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };
    fetchAppointments();
  }, []);

  const todayAppointments = appointments.filter((apt) => apt.date === selectedDate);
  const upcomingAppointments = appointments.filter((apt) => apt.date > selectedDate);
  const appointmentDates = new Set(appointments.map((apt) => apt.date));

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">
            Manage patient appointments and schedule new consultations
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar View ({today.toLocaleString("default", { month: "long" })} {year})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDay + daysInMonth }, (_, i) => {
                const day = i - firstDay + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                  day
                ).padStart(2, "0")}`;
                const isToday = dateStr === new Date().toISOString().split("T")[0];
                const isSelected = dateStr === selectedDate;
                const hasAppointment = appointmentDates.has(dateStr);

                return (
                  <div
                    key={i}
                    onClick={() => day > 0 && day <= daysInMonth && setSelectedDate(dateStr)}
                    className={`p-3 text-center text-sm border rounded-lg cursor-pointer transition-colors
                      ${isToday ? "bg-primary text-primary-foreground" : ""}
                      ${isSelected && !isToday ? "bg-accent" : ""}
                      ${hasAppointment ? "border-primary font-semibold" : "border-border"}`}
                  >
                    {day > 0 && day <= daysInMonth ? day : ""}
                    {hasAppointment && (
                      <div className="w-2 h-2 bg-primary rounded-full mx-auto mt-1"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {selectedDate === new Date().toISOString().split("T")[0]
                ? "Today's Schedule"
                : `Schedule for ${selectedDate}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((appointment) => (
                <div key={appointment._id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={appointment.patientPhoto} alt={appointment.patientName} />
                        <AvatarFallback>
                          {appointment.patientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{appointment.patientName}</p>
                        {appointment.reason && (
                          <p className="text-xs italic text-gray-500">{appointment.reason}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={`text-xs ${getPriorityColor(appointment.priority)}`}>
                      {appointment.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{appointment.type}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(appointment.date, appointment.time)}
                    </p>
                    <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No appointments</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={appointment.patientPhoto} alt={appointment.patientName} />
                      <AvatarFallback>
                        {appointment.patientName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{appointment.patientName}</p>
                      <p className="text-sm text-muted-foreground">{appointment.type}</p>
                      {appointment.reason && (
                        <p className="text-xs italic text-gray-500">{appointment.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatDateTime(appointment.date, appointment.time)}
                      </p>
                    </div>
                    <Badge className={`text-xs ${getPriorityColor(appointment.priority)}`}>
                      {appointment.priority}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">Reschedule</Button>
                      <Button variant="ghost" size="sm" className="text-red-500">Cancel</Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No upcoming appointments</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
