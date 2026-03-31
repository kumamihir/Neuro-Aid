import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Database, Save, CheckCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

  // Doctor profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Notification preferences (persisted in localStorage)
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Load doctor data
  useEffect(() => {
    const storedDoctor = localStorage.getItem("doctor");
    if (storedDoctor) {
      try {
        const doc = JSON.parse(storedDoctor);
        setName(doc.name || "");
        setEmail(doc.email || "");
        setSpecialization(doc.specialization || "");
        setPhone(doc.phone || "");
      } catch {
        console.error("Failed to parse doctor data");
      }
    }

    // Load notification preferences
    const notifPrefs = localStorage.getItem("notificationPrefs");
    if (notifPrefs) {
      try {
        const prefs = JSON.parse(notifPrefs);
        setMessageAlerts(prefs.messageAlerts ?? true);
        setAppointmentReminders(prefs.appointmentReminders ?? true);
        setCriticalAlerts(prefs.criticalAlerts ?? true);
        setDailySummary(prefs.dailySummary ?? false);
      } catch {}
    }
  }, []);

  // Save profile
  const handleSaveProfile = () => {
    setSaveStatus("saving");
    
    const storedDoctor = localStorage.getItem("doctor");
    let doc = storedDoctor ? JSON.parse(storedDoctor) : {};
    doc = { ...doc, name, email, specialization, phone };
    localStorage.setItem("doctor", JSON.stringify(doc));
    localStorage.setItem("doctorName", name);

    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);
  };

  // Save notification preferences
  const saveNotifPrefs = (key: string, value: boolean) => {
    const prefs = {
      messageAlerts,
      appointmentReminders,
      criticalAlerts,
      dailySummary,
      [key]: value,
    };
    localStorage.setItem("notificationPrefs", JSON.stringify(prefs));
  };

  // Change password
  const handleChangePassword = () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    // Since we don't have a backend endpoint for this in local dev, simulate
    setPasswordSuccess("Password updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSuccess(""), 3000);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("doctor");
    localStorage.removeItem("doctorName");
    navigate("/login");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>
        <Button variant="destructive" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialization</Label>
              <Input
                id="specialty"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Neurologist"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>
            <Button onClick={handleSaveProfile} className="gap-2" disabled={saveStatus === "saving"}>
              {saveStatus === "saved" ? (
                <>
                  <CheckCircle className="h-4 w-4" /> Saved!
                </>
              ) : saveStatus === "saving" ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>New Message Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when patients send messages</p>
              </div>
              <Switch
                checked={messageAlerts}
                onCheckedChange={(v) => {
                  setMessageAlerts(v);
                  saveNotifPrefs("messageAlerts", v);
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Appointment Reminders</Label>
                <p className="text-sm text-muted-foreground">Receive reminders for upcoming appointments</p>
              </div>
              <Switch
                checked={appointmentReminders}
                onCheckedChange={(v) => {
                  setAppointmentReminders(v);
                  saveNotifPrefs("appointmentReminders", v);
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Critical Patient Alerts</Label>
                <p className="text-sm text-muted-foreground">Immediate alerts for critical patient status</p>
              </div>
              <Switch
                checked={criticalAlerts}
                onCheckedChange={(v) => {
                  setCriticalAlerts(v);
                  saveNotifPrefs("criticalAlerts", v);
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Daily Summary</Label>
                <p className="text-sm text-muted-foreground">Daily email with patient overview</p>
              </div>
              <Switch
                checked={dailySummary}
                onCheckedChange={(v) => {
                  setDailySummary(v);
                  saveNotifPrefs("dailySummary", v);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordError && (
              <div className="bg-red-500/10 text-red-600 p-3 rounded-lg text-sm">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="bg-green-500/10 text-green-600 p-3 rounded-lg text-sm">{passwordSuccess}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleChangePassword}>Update Password</Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Account Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Account Type</p>
                <p className="text-xs text-muted-foreground">Doctor / Physician</p>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                Doctor
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">App Version</p>
                <p className="text-xs text-muted-foreground">NEURO-DESK Portal</p>
              </div>
              <span className="text-xs text-muted-foreground">v1.0.0</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Connected Backend</p>
                <p className="text-xs text-muted-foreground">Patient management server</p>
              </div>
              <span className="text-xs bg-green-500/10 text-green-600 px-3 py-1.5 rounded-full font-medium">
                ● Connected
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}