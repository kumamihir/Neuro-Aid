// src/components/Layout.tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Stethoscope, LogOut, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<{ name: string; role: string } | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const storedDoctor = localStorage.getItem("doctor");
    const token = localStorage.getItem("token");

    if (!storedDoctor || !token) {
      navigate("/login"); // Redirect if not logged in
    } else {
      setDoctor(JSON.parse(storedDoctor));
    }

    // Initialize dark mode from localStorage
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("doctor");
    navigate("/login");
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return newMode;
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background dark:bg-background-dark">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border dark:bg-card-dark dark:border-border-dark">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <Stethoscope className="h-6 w-6 text-primary dark:text-primary-dark" />
                <h1 className="text-xl font-semibold text-foreground dark:text-foreground-dark">
                  NEURO-DESK
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-muted dark:hover:bg-muted-dark"
                title="Toggle Dark Mode"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>

              {doctor && (
                <>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground dark:text-foreground-dark">
                      {doctor.name}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
                      {doctor.role}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center dark:bg-primary-dark">
                    <span className="text-sm font-medium text-primary-foreground dark:text-primary-foreground-dark">
                      {doctor.name.charAt(0)}
                    </span>
                  </div>
                </>
              )}

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="ml-4 p-2 rounded-lg hover:bg-muted dark:hover:bg-muted-dark"
                title="Logout"
              >
                <LogOut className="h-5 w-5 text-red-500" />
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
