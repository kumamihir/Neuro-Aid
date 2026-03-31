import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bell, Plus, Trash2, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  time: string;
  type: "reminder" | "appointment";
  dateTime?: string;
}

export default function NotificationsPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDateTime, setNewDateTime] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const token = localStorage.getItem("token");
  const BASE_URL = import.meta.env.DEV ? "http://localhost:10001" : "https://patient-backend-olyv.onrender.com";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch appointments
        const apptRes = await fetch(`${BASE_URL}/api/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let appointments: Task[] = [];
        if (apptRes.ok) {
          const apptData = await apptRes.json();
          const apptList = apptData.appointments || apptData || [];
          if (Array.isArray(apptList)) {
            appointments = apptList.map((a: any) => ({
              id: a._id || a.id,
              title: a.reason ? `Doctor: ${a.reason}` : "Doctor Appointment",
              time: formatDateTime(`${a.date}T${a.time}`),
              type: "appointment" as const,
              dateTime: `${a.date}T${a.time}`,
            }));
          }
        }

        // Fetch reminders
        const remRes = await fetch(`${BASE_URL}/api/reminders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let reminders: Task[] = [];
        if (remRes.ok) {
          const remData = await remRes.json();
          const remList = remData.reminders || [];
          if (Array.isArray(remList)) {
            reminders = remList.map((r: any) => ({
              id: r._id || r.id,
              title: r.title,
              time: formatDateTime(r.dateTime || `${r.date}T${r.time}`),
              type: "reminder" as const,
              dateTime: r.dateTime || `${r.date}T${r.time}`,
            }));
          }
        }

        const combined = [...appointments, ...reminders];
        setTasks(combined);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        toast({ title: "Error fetching notifications" });
      }
    };

    if (token) fetchData();
  }, [token]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prev) =>
        prev.filter((task) => {
          if (task.type === "appointment" && task.dateTime) {
            return new Date(task.dateTime).getTime() > Date.now();
          }
          return true;
        })
      );
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const enableNotifications = () => {
    if (!("Notification" in window)) {
      toast({ title: "Notifications not supported" });
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        toast({
          title: "Reminders enabled",
          description: "You will get notifications for appointments.",
        });
        new Notification("Notifications Enabled!", {
          body: "You will now receive reminders for your appointments.",
        });
      } else if (permission === "denied") {
        toast({
          title: "Permission denied",
          description: "Enable notifications in your browser settings.",
        });
      }
    });
  };

  function formatDateTime(dateTimeString: string) {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) {
      console.warn("Invalid dateTime:", dateTimeString);
      return "Invalid date";
    }
    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${day}, ${time}`;
  }

  const addTask = async () => {
    if (!newTitle.trim() || !newDateTime) {
      toast({ title: "Please enter both title and date/time" });
      return;
    }
    if (!token) {
      toast({ title: "Authentication token missing. Please login." });
      return;
    }

    setIsAdding(true);
    try {
      const dateObj = new Date(newDateTime);
      const date = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
      const time = dateObj.toTimeString().slice(0, 5); // HH:MM

      const res = await fetch(`${BASE_URL}/api/reminders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          date,
          time,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.log("Failed to save reminder:", text);
        throw new Error("Failed to save reminder");
      }

      const data = await res.json();
      const reminderData = data.reminder || data;

      const savedReminder: Task = {
        id: reminderData._id || reminderData.id,
        title: newTitle,
        time: formatDateTime(`${date}T${time}`),
        type: "reminder",
        dateTime: `${date}T${time}`,
      };

      setTasks((prev) => [...prev, savedReminder]);
      setNewTitle("");
      setNewDateTime("");
      toast({ title: "Reminder added successfully!" });
    } catch (err) {
      console.error("❌ Error adding reminder:", err);
      toast({ title: "Failed to add reminder" });
    }
    setIsAdding(false);
  };

  const deleteTask = async (id: string) => {
    try {
      const taskToDelete = tasks.find((t) => t.id === id);
      if (taskToDelete?.type !== "reminder") return;

      const res = await fetch(`${BASE_URL}/api/reminders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete reminder");

      setTasks((prev) => prev.filter((task) => task.id !== id));
      toast({ title: "Reminder deleted" });
    } catch (err) {
      console.error("❌ Error deleting reminder:", err);
      toast({ title: "Failed to delete reminder" });
    }
  };

  const visibleTasks = showAll ? tasks : tasks.slice(0, 2);

  return (
    <Card aria-labelledby="notifications-title">
      <CardHeader>
        <CardTitle id="notifications-title">Notifications</CardTitle>
        <CardDescription>
          Upcoming appointments and medicine reminders for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <Button
            onClick={enableNotifications}
            size="lg"
            variant="soft"
            aria-label="Enable reminders"
          >
            <Bell /> Enable Reminders
          </Button>
        </div>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Task title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Input
            type="datetime-local"
            value={newDateTime}
            onChange={(e) => setNewDateTime(e.target.value)}
          />
          <Button onClick={addTask} aria-label="Add task" disabled={isAdding}>
            <Plus />
          </Button>
        </div>
        <ul className="space-y-3">
          {tasks.length === 0 && (
            <li className="text-center text-muted-foreground">
              No upcoming reminders or appointments.
            </li>
          )}
          {visibleTasks.map((n) => (
            <li
              key={n.id}
              className={`flex justify-between items-center rounded-md px-4 py-3 ${
                n.type === "appointment" ? "bg-blue-100" : "bg-muted"
              }`}
            >
              <div>
                <span className="block text-lg font-medium">{n.title}</span>
                <span className="text-muted-foreground">{n.time}</span>
              </div>
              {n.type === "reminder" && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteTask(n.id)}
                  aria-label="Delete task"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </Button>
              )}
            </li>
          ))}
        </ul>
        {tasks.length > 2 && (
          <div className="flex justify-center mt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAll((prev) => !prev)}
              className="flex items-center gap-1"
            >
              {showAll ? "Show Less" : "Show More"}{" "}
              <ChevronDown className={`w-4 h-4 ${showAll ? "rotate-180" : ""}`} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
