import { useState, useEffect } from "react";
import { User, Activity, Settings2, ShieldCheck, Mail, Save } from "lucide-react";
import HeaderNav from "@/components/HeaderNav";
import { Button } from "@/components/ui/button";

type Patient = {
  _id: string;
  name: string;
  email: string;
  subscriptionPlan: "Basic" | "Plus" | "Pro";
  role: string;
  status: string;
  phone: string;
};

export default function AdminPage() {
  const [users, setUsers] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const API_URL = import.meta.env.DEV ? "http://localhost:10001" : "https://patient-backend-olyv.onrender.com";
      const res = await fetch(`${API_URL}/admin/users`);
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpdate = async (userId: string, newPlan: string) => {
    try {
      const API_URL = import.meta.env.DEV ? "http://localhost:10001" : "https://patient-backend-olyv.onrender.com";
      const res = await fetch(`${API_URL}/admin/users/${userId}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u._id === userId ? { ...u, subscriptionPlan: newPlan as "Basic" | "Plus" | "Pro" } : u)));
      } else {
        alert("Failed to update plan");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating plan");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <HeaderNav />
      <div className="container mx-auto px-6 py-10 max-w-7xl">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-800 dark:text-slate-100 flex items-center gap-3">
             <ShieldCheck className="w-10 h-10 text-emerald-500" />
             Admin Command Center
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Manage users, monitor subscription tiers, and oversee platform activity.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-emerald-600">Loading system data...</div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider">User Info</th>
                    <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider">Current Plan</th>
                    <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                             <User className="text-emerald-600 h-5 w-5" />
                           </div>
                           <div>
                             <p className="font-bold text-slate-800 dark:text-slate-100">{u.name}</p>
                             <p className="text-xs text-slate-500 uppercase font-medium mt-1">ID: {u._id.slice(-6)}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <Mail className="w-4 h-4 text-slate-400" /> {u.email}
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                             u.status === 'new' ? 'bg-blue-100 text-blue-700' : 
                             u.status === 'attention' ? 'bg-orange-100 text-orange-700' :
                             u.status === 'critical' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                         }`}>
                           {u.status.toUpperCase()}
                         </span>
                      </td>
                      <td className="px-6 py-5">
                         <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                             u.subscriptionPlan === 'Pro' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 
                             u.subscriptionPlan === 'Plus' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                         }`}>
                           {u.subscriptionPlan?.toUpperCase() || "BASIC"}
                         </span>
                      </td>
                      <td className="px-6 py-5 text-right flex justify-end items-center gap-2">
                         <select 
                           className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                           value={u.subscriptionPlan || "Basic"}
                           onChange={(e) => handlePlanUpdate(u._id, e.target.value)}
                         >
                           <option value="Basic">Basic</option>
                           <option value="Plus">Plus</option>
                           <option value="Pro">Pro</option>
                         </select>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
