import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authAPI, friendAPI, expenseAPI } from "../services/api";
import { ThemeToggle } from "../components/common/ThemeToggle";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// Types
interface Friend { id: number; name: string; email: string }
interface FriendBalance { name: string; amount: string; status: string; color: string }
interface DashboardData {
  totalBalance: number;
  totalYouOwe: number;
  totalYouAreOwed: number;
  youOweList: FriendBalance[];
  youAreOwedList: FriendBalance[];
}
interface Expense {
  id: number;
  description: string;
  amount: number;
  splitType: string;
  paidBy: string;
  dateTime: string;
  friend?: { name: string };
}

// Helpers
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const PIE_COLORS = ["#047857", "#be123c", "#334155", "#b45309", "#0369a1"];

const SPLIT_LABEL: Record<string, string> = {
  equal: "Equal", shares: "Shares", adjustment: "Adjusted",
  "they-owe": "They Owe", "you-owe": "You Owe",
};

// Sub-components
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</span>
      <span className={`text-2xl font-black tracking-tight ${accent}`}>{value}</span>
      <span className="text-[11px] text-slate-400 dark:text-slate-500">{sub}</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-slate-700 dark:text-slate-200">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// Main Dashboard
export default function Dashboard() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const userRaw = localStorage.getItem("spenvaUser");
  const user = JSON.parse(userRaw || "null") as { name?: string; profileName?: string; email?: string } | null;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [balRes, friendRes, expRes] = await Promise.all([
          friendAPI.getBalances(),
          friendAPI.getAll(),
          expenseAPI.getAll(),
        ]);
        setDashboardData(balRes.data);
        setFriendsList(friendRes.data || []);
        setExpenses(expRes.data || []);
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userRaw]);

  if (!user) return <Navigate to="/login" replace />;

  const profileName = user.profileName || user.name || "User";
  const initial = profileName.charAt(0).toUpperCase();

  const handleLogout = () => {
    authAPI.logout();
    sessionStorage.clear();
    navigate("/login");
  };

  // Derived data
  const recentExpenses = [...expenses].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  ).slice(0, 6);

  const monthlyMap: Record<string, number> = {};
  expenses.forEach((e) => {
    const d = new Date(e.dateTime);
    const key = d.toLocaleString("default", { month: "short" });
    monthlyMap[key] = (monthlyMap[key] || 0) + e.amount;
  });
  const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const chartData = monthOrder.filter((m) => monthlyMap[m]).slice(-6).map((m) => ({ month: m, spent: monthlyMap[m] }));

  const splitMap: Record<string, number> = {};
  expenses.forEach((e) => {
    const label = SPLIT_LABEL[e.splitType] || e.splitType;
    splitMap[label] = (splitMap[label] || 0) + e.amount;
  });
  const pieData = Object.entries(splitMap).map(([name, value]) => ({ name, value }));

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const netBalance = (dashboardData?.totalYouAreOwed ?? 0) - (dashboardData?.totalYouOwe ?? 0);

  // Nav items
  const NAV_ITEMS = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Friends", to: "/friends-dashboard" },
    { label: "Groups", to: "/group" },
    { label: "Add Expense", to: "/expense" },
  ];

  return (
    <div
      className="min-h-screen bg-[#f4f5f7] dark:bg-slate-950 text-slate-800 dark:text-slate-200 antialiased transition-colors"
      
    >
      {/* Header */}
      <header className="bg-white dark:bg-slate-950 text-slate-950 shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:px-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-2xl font-bold tracking-normal text-slate-950 transition-opacity hover:opacity-80 dark:text-white"
            
          >
            <span className="bg-slate-950 px-2.5 py-0.5 text-white shadow-sm dark:bg-white dark:text-slate-950">S</span>
            <span>Spenva</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ label, to }) => (
              <button
                type="button"
                key={to}
                onClick={() => navigate(to)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 border border-slate-300 bg-white px-3 py-1.5 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
              >
                <span className="flex h-7 w-7 items-center justify-center bg-slate-950 text-xs font-bold text-white dark:bg-white dark:text-slate-950">{initial}</span>
                <span className="hidden text-xs font-medium text-slate-700 dark:text-slate-200 md:block">{profileName}</span>
                <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 shadow-xl">
                  <Link to="/setting" className="block px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Your account
                  </Link>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 md:px-6 py-8 space-y-8">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ letterSpacing: "-0.02em" }}>
            Good to see you, {profileName.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Here's your Spenva financial snapshot</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Spent"
                value={fmt(totalSpent)}
                sub={`${expenses.length} expense${expenses.length !== 1 ? "s" : ""} logged`}
                accent="text-slate-800 dark:text-white"
              />
              <StatCard
                label="Net Balance"
                value={fmt(Math.abs(netBalance))}
                sub={netBalance >= 0 ? "In your favour" : "You owe overall"}
                accent={netBalance >= 0 ? "text-teal-600 dark:text-white" : "text-rose-500 dark:text-rose-400"}
              />
              <StatCard
                label="You Are Owed"
                value={fmt(dashboardData?.totalYouAreOwed ?? 0)}
                sub={`From ${dashboardData?.youAreOwedList.length ?? 0} friend${(dashboardData?.youAreOwedList.length ?? 0) !== 1 ? "s" : ""}`}
                accent="text-teal-600 dark:text-white"
              />
              <StatCard
                label="You Owe"
                value={fmt(dashboardData?.totalYouOwe ?? 0)}
                sub={`To ${dashboardData?.youOweList.length ?? 0} friend${(dashboardData?.youOweList.length ?? 0) !== 1 ? "s" : ""}`}
                accent="text-rose-500 dark:text-rose-400"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Area Chart */}
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Monthly Spending</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">From your logged expenses</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-white border border-teal-200/50 dark:border-teal-900 px-2 py-1 rounded-lg">
                    Live data
                  </span>
                </div>
                {chartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                    No expenses recorded yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={50}
                        tickFormatter={(v) => `Rs ${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="spent" name="Spent" stroke="#0d9488" strokeWidth={2.5} fill="url(#gradSpent)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Pie Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">Split Types</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">How your expenses are split</p>
                {pieData.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">No data yet</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false}>
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-3 space-y-1.5">
                      {pieData.slice(0, 4).map(({ name, value }, i) => (
                        <div key={name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-slate-500 dark:text-slate-400">{name}</span>
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{fmt(value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Recent Expenses */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Recent Expenses</h3>
                  <Link to="/friends-dashboard" className="text-xs font-medium text-teal-600 dark:text-white hover:underline flex items-center gap-1">
                    View all
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                {recentExpenses.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No expenses yet. <Link to="/expense" className="text-teal-600 dark:text-white hover:underline">Add your first one!</Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentExpenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={() => navigate(`/friends-dashboard?friendName=${encodeURIComponent(exp.friend?.name ?? "")}`)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 flex-shrink-0">Rs</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{exp.description}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {exp.friend?.name ?? "-"} - Paid by {exp.paidBy === "you" ? "You" : exp.friend?.name}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{fmt(exp.amount)}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {new Date(exp.dateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                          exp.splitType === "equal" ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300 border border-blue-100/40 dark:border-blue-900" :
                          exp.splitType === "shares" ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700" :
                          exp.splitType === "adjustment" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-300 border border-amber-100/40 dark:border-amber-900" :
                          "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/40 dark:border-slate-700"
                        }`}>
                          {SPLIT_LABEL[exp.splitType] ?? exp.splitType}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Widgets */}
              <div className="space-y-4">
                {/* Quick actions */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Add an expense", to: "/expense", color: "bg-teal-600 hover:bg-teal-700 text-white" },
                      { label: "View Friends", to: "/friends-dashboard", color: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200" },
                      { label: "View Groups", to: "/group-dashboard", color: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200" },
                    ].map(({ label, to, color }) => (
                      <button
                        key={to}
                        type="button"
                        onClick={() => navigate(to)}
                        className={`w-full text-xs font-medium py-2.5 px-4 rounded-xl transition-colors text-left ${color} cursor-pointer`}
                      >
                          {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Friends summary */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Friends</h3>
                    <Link to="/friends-dashboard" className="text-xs text-teal-600 dark:text-white hover:underline font-medium">All</Link>
                  </div>
                  {friendsList.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500">No friends added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {friendsList.slice(0, 4).map((friend) => {
                        const owed = dashboardData?.youAreOwedList.find(f => f.name.toLowerCase() === friend.name.toLowerCase());
                        const owes = dashboardData?.youOweList.find(f => f.name.toLowerCase() === friend.name.toLowerCase());
                        return (
                          <div
                            key={friend.id}
                            onClick={() => navigate(`/friends-dashboard?friendName=${encodeURIComponent(friend.name)}`)}
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 flex-shrink-0">
                              {friend.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{friend.name}</p>
                              <p className={`text-[10px] ${owed ? "text-teal-600 dark:text-white" : owes ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"}`}>
                                {owed ? `owes you ${owed.amount}` : owes ? `you owe ${owes.amount}` : "settled up"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Balance health */}
                <div className="bg-slate-950 dark:bg-slate-900 rounded-2xl p-5 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-300/70 mb-1">Balance status</p>
                  <p className={`text-xl font-bold ${netBalance >= 0 ? "text-teal-300" : "text-rose-300"}`}>
                    {netBalance >= 0 ? "You're ahead" : "You owe overall"}
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    Net: {netBalance >= 0 ? "+" : "-"}{fmt(Math.abs(netBalance))}
                  </p>
                  <Link to="/friends-dashboard">
                    <button className="mt-4 w-full text-xs font-medium py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-colors cursor-pointer">
                      Settle up
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}





