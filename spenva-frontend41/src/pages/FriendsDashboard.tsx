import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/common/Button";
import { friendAPI, authAPI, expenseAPI } from "../services/api";
import { ThemeToggle } from "../components/common/ThemeToggle";

interface Friend {
  id: number;
  name: string;
  email: string;
}

interface FriendBalance {
  name: string;
  status: string;
  amount: string;
  color: string;
}

interface DashboardData {
  totalBalance: number;
  totalYouOwe: number;
  totalYouAreOwed: number;
  youOweList: FriendBalance[];
  youAreOwedList: FriendBalance[];
}

// Rotating tips
const TIPS = [
  "Split equally when everyone orders similar amounts.",
  "Settle up weekly to avoid awkward debt buildup.",
  "Use 'shares' split when one person ordered more.",
  "Logging expenses right away keeps things accurate.",
  "Clear debts before a trip ends; easier in person.",
  "Adjustment split works great for shared groceries.",
];

function FriendsDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlFriendName = searchParams.get("friendName");

  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [friendExpenses, setFriendExpenses] = useState<any[]>([]);
  const [friendBalance, setFriendBalance] = useState<{ youOwe: number; youAreOwed: number; net: number } | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [tipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));

  const userRaw = localStorage.getItem("spenvaUser");
  const user = JSON.parse(userRaw || "null");

  // Derived: total groups count from localStorage
  const totalGroups = groups.length;
  const totalFriends = friendsList.length;

  const fetchDashboardData = async () => {
    try {
      const response = await friendAPI.getBalances();
      setDashboardData(response.data);
      const storedGroups = localStorage.getItem("spenva_groups");
      setGroups(storedGroups ? JSON.parse(storedGroups) : []);
      const friendsRes = await friendAPI.getAll();
      setFriendsList(friendsRes.data || []);
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
    }
  };

  const fetchFriendExpenses = async () => {
    if (!urlFriendName) return;
    setLoadingExpenses(true);
    try {
      const response = await expenseAPI.getAll();
      const allExpenses = response.data || [];
      const filtered = allExpenses.filter(
        (e: any) => e.friend && e.friend.name === urlFriendName
      );

      let youOweTotal = 0;
      let youAreOwedTotal = 0;

      const processed = filtered.map((e: any) => {
        const amount = e.amount;
        const splitType = e.splitType;
        const paidBy = (e.paidBy || "you").toLowerCase();
        let change = 0;

        if (splitType === "equal") {
          change = paidBy === "you" ? amount / 2 : -amount / 2;
        } else if (splitType === "they-owe") {
          change = paidBy === "you" ? amount : 0;
        } else if (splitType === "you-owe") {
          change = paidBy === "friend" ? -amount : 0;
        } else if (splitType === "shares") {
          const ys = e.yourShares <= 0 ? 1 : (e.yourShares || 1);
          const fs = e.friendShares <= 0 ? 1 : (e.friendShares || 1);
          const total = ys + fs;
          change = paidBy === "you"
            ? (fs / total) * amount
            : -(ys / total) * amount;
        } else if (splitType === "adjustment") {
          const ya = e.yourAdjustment || 0;
          const fa = e.friendAdjustment || 0;
          const remaining = amount - ya - fa;
          const base = remaining > 0 ? remaining / 2 : 0;
          const youPay = base + ya;
          const friendPays = base + fa;
          change = paidBy === "you" ? friendPays : -youPay;
        }

        if (change > 0) youAreOwedTotal += change;
        else if (change < 0) youOweTotal += Math.abs(change);

        return { ...e, calculatedChange: change };
      });

      const netBalance = youAreOwedTotal - youOweTotal;
      setFriendExpenses(processed);
      setFriendBalance({
        youOwe: netBalance < 0 ? Math.abs(netBalance) : 0,
        youAreOwed: netBalance > 0 ? netBalance : 0,
        net: netBalance,
      });
    } catch (err) {
      console.error("Error loading friend expenses:", err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [userRaw]);

  useEffect(() => {
    if (!user) return;
    fetchFriendExpenses();
  }, [userRaw, urlFriendName]);

  if (!user) return <Navigate to="/login" replace />;

  const profileName = user.profileName || user.name || "User";
  const initial = profileName.charAt(0).toUpperCase();

  const handleLogout = () => {
    authAPI.logout();
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-slate-950 text-slate-800 dark:text-slate-200 antialiased transition-colors"
      >

      {/* Header */}
      <header className="bg-white dark:bg-slate-950 text-slate-950 shadow-sm border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 md:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-2xl font-bold tracking-normal text-slate-950 transition-opacity hover:opacity-80 dark:text-white">
            <span className="bg-slate-950 px-2.5 py-0.5 text-white shadow-sm dark:bg-white dark:text-slate-950">S</span>
            <span>Spenva</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="relative">
              <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 border border-slate-300 bg-white px-3 py-1.5 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900">
                <span className="flex h-7 w-7 items-center justify-center bg-slate-950 text-xs font-bold text-white dark:bg-white dark:text-slate-950">{initial}</span>
                <span className="hidden text-xs font-medium text-slate-700 dark:text-slate-200 md:block">{profileName}</span>
                <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 text-slate-700 dark:text-slate-200 shadow-xl">
                  <Link to="/setting" className="block px-4 py-2.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Your account</Link>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  <button type="button" onClick={handleLogout} className="block w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-colors cursor-pointer">Log out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-0 bg-white dark:bg-slate-900 min-h-[calc(100vh-68px)] shadow-lg border-x border-slate-100 dark:border-slate-800 md:grid-cols-[240px_1fr] lg:grid-cols-[240px_1fr_220px] transition-colors">

        {/* Sidebar */}
        <aside className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-6 md:min-h-[calc(100vh-68px)] md:border-b-0 md:border-r transition-colors">
          <nav className="space-y-1">
            <Link
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white hover:shadow-sm border border-transparent hover:border-slate-200/40 dark:hover:border-slate-700 transition-all"
              to="/dashboard"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Dashboard
            </Link>
          </nav>

          {/* Tip of the Day */}
          <div className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-white mb-1.5 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              Tip
            </p>
            <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-200">{TIPS[tipIndex]}</p>
          </div>

          {/* Quick stats from localStorage */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-3 text-center">
              <p className="text-lg font-black text-slate-950 dark:text-white">{totalFriends}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">friends</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-3 text-center">
              <p className="text-lg font-black text-slate-950 dark:text-white">{totalGroups}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">groups</p>
            </div>
          </div>

          {/* Groups Section */}
          <div className="mt-7 border-t border-slate-200/60 dark:border-slate-800 pt-5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 mb-2">
              <Link to="/group-dashboard" className="hover:text-slate-950 dark:hover:text-white transition-colors">Groups</Link>
              <button onClick={() => navigate("/group")} className="text-slate-950 dark:text-white hover:underline cursor-pointer">+ add</button>
            </div>
            <div className="mt-2 space-y-1 max-h-[140px] overflow-y-auto pr-1">
              {groups.length === 0 ? (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 px-3 py-1">No groups yet.</p>
              ) : (
                groups.map((group) => (
                  <button key={group} onClick={() => navigate(`/group-dashboard?groupName=${encodeURIComponent(group)}`)} className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm border border-transparent hover:border-slate-200/30 dark:hover:border-slate-700 transition-all truncate cursor-pointer">{group}</button>
                ))
              )}
            </div>
          </div>

          {/* Friends Section */}
          <div className="mt-6 border-t border-slate-200/60 dark:border-slate-800 pt-5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-950 dark:text-white px-1 mb-2">
              <Link to="/friends-dashboard" className="border-l-4 border-slate-950 dark:border-white pl-2 transition-colors">Friends</Link>
              <button onClick={() => navigate("/expense", { state: { newFriend: true } })} className="text-slate-950 dark:text-white hover:underline cursor-pointer">+ add</button>
            </div>
            <div className="mt-2 space-y-1 max-h-[260px] overflow-y-auto pr-1">
              {friendsList.length === 0 ? (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 px-3 py-1">No friends added yet.</p>
              ) : (
                friendsList.map((friend) => {
                  const owedFriend = dashboardData?.youAreOwedList.find(f => f.name.toLowerCase() === friend.name.toLowerCase());
                  const oweFriend = dashboardData?.youOweList.find(f => f.name.toLowerCase() === friend.name.toLowerCase());
                  let balanceText = "settled up";
                  let balanceColor = "text-slate-400 dark:text-slate-500";
                  if (owedFriend) { balanceText = `owes you ${owedFriend.amount}`; balanceColor = "text-teal-600 dark:text-white font-semibold"; }
                  else if (oweFriend) { balanceText = `you owe ${oweFriend.amount}`; balanceColor = "text-rose-500 dark:text-rose-400 font-semibold"; }
                  const isSelected = urlFriendName === friend.name;
                  return (
                    <button
                      key={friend.id}
                      onClick={() => navigate(`/friends-dashboard?friendName=${encodeURIComponent(friend.name)}`)}
                      className={`block w-full rounded-lg px-3 py-2 text-left transition-all duration-200 group cursor-pointer ${
                        isSelected ? "bg-white dark:bg-slate-800 border-l-4 border-slate-950 dark:border-white shadow-sm font-bold" : "hover:bg-white/80 dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-xs truncate ${isSelected ? "text-slate-950 dark:text-white" : "text-slate-700 dark:text-slate-300 group-hover:text-slate-950 dark:group-hover:text-teal-400"}`}>
                          {friend.name}
                        </span>
                      </div>
                      <div className={`text-[10px] mt-0.5 truncate ${balanceColor}`}>{balanceText}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        {urlFriendName ? (
          <section className="min-h-[calc(100vh-68px)] border-slate-100 dark:border-slate-800 lg:border-r p-6 transition-colors">
            <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 md:flex-row md:items-center md:justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-black text-lg shadow-sm">
                  {urlFriendName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight" style={{ letterSpacing: "-0.02em" }}>{urlFriendName}</h1>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Expense history & balance</p>
                </div>
              </div>
              <Button label="Add an expense" onClick={() => navigate("/expense")} />
            </div>

            {friendBalance && (
              <div className="grid grid-cols-3 gap-0.5 border border-slate-200/50 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-center mb-8 rounded-2xl overflow-hidden shadow-sm transition-colors">
                <div className="bg-white dark:bg-slate-900 px-3 py-4 flex flex-col justify-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">net balance</p>
                  <p className={`text-lg font-black leading-none ${friendBalance.net < 0 ? 'text-rose-500 dark:text-rose-400' : friendBalance.net > 0 ? 'text-teal-600 dark:text-white' : 'text-slate-500'}`}>
                    Rs {Math.abs(friendBalance.net).toFixed(2)}
                  </p>
                  <span className={`text-[10px] font-medium mt-1 inline-block ${friendBalance.net < 0 ? 'text-rose-500/80' : friendBalance.net > 0 ? 'text-teal-600/80 dark:text-white/80' : 'text-slate-400'}`}>
                    {friendBalance.net < 0 ? 'you owe them' : friendBalance.net > 0 ? 'they owe you' : 'settled up'}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 px-3 py-4 flex flex-col justify-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">you owe</p>
                  <p className="text-lg font-black leading-none text-rose-500 dark:text-rose-400">Rs {friendBalance.youOwe.toFixed(2)}</p>
                  <span className="text-[10px] font-medium mt-1 text-slate-400 dark:text-slate-500">{friendBalance.youOwe > 0 ? 'needs settlement' : 'no debt'}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 px-3 py-4 flex flex-col justify-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">they owe</p>
                  <p className="text-lg font-black leading-none text-teal-600 dark:text-white">Rs {friendBalance.youAreOwed.toFixed(2)}</p>
                  <span className="text-[10px] font-medium mt-1 text-slate-400 dark:text-slate-500">{friendBalance.youAreOwed > 0 ? 'owes you money' : 'no debt'}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expense Ledger */}
              <div className="border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col min-h-[300px] transition-colors">
                <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-950 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Expense Ledger
                </h2>
                {loadingExpenses ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic py-4">Loading...</p>
                ) : friendExpenses.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-400 dark:text-slate-500">No logged expenses with {urlFriendName} yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5 divide-y divide-slate-50 dark:divide-slate-800 max-h-[360px] overflow-y-auto pr-1">
                    {friendExpenses.map((exp: any, idx: number) => (
                      <div key={exp.id} className={`flex items-center justify-between ${idx > 0 ? "pt-3.5" : ""}`}>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">{exp.description}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Paid by <span className="font-semibold text-slate-500 dark:text-slate-400">{exp.paidBy === "you" ? "You" : urlFriendName}</span> - {new Date(exp.dateTime).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-slate-950 dark:text-white">Rs {parseFloat(exp.amount).toFixed(2)}</p>
                          <span className={`text-[8.5px] uppercase font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block ${
                            exp.splitType === "equal" ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300 border border-blue-100/40 dark:border-blue-900" :
                            exp.splitType === "shares" ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700" :
                            exp.splitType === "adjustment" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-300 border border-amber-100/40 dark:border-amber-900" :
                            "bg-slate-50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-300 border border-slate-100/40 dark:border-slate-800"
                          }`}>
                            {exp.splitType === "equal" ? "Equally" : exp.splitType === "shares" ? "Shares" : exp.splitType === "adjustment" ? "Adjusted" : exp.splitType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Balances Breakdown */}
              <div className="border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col min-h-[300px] transition-colors">
                <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-950 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Balances Breakdown
                </h2>
                {loadingExpenses ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic py-4">Loading...</p>
                ) : friendExpenses.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-teal-50/30 dark:bg-teal-950/20 border border-dashed border-teal-200/50 dark:border-teal-900/50 rounded-xl">
                    <p className="text-teal-800 dark:text-slate-200 font-semibold text-xs">All settled up.</p>
                    <p className="text-[10px] text-teal-600/80 dark:text-white/80 mt-0.5">No transaction records found.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {friendExpenses.map((exp: any) => {
                      const change = exp.calculatedChange;
                      return (
                        <div key={exp.id} className="border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <div className="truncate pr-2">
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{exp.description}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {change < 0 ? "You owe" : change > 0 ? `${urlFriendName} owes you` : "No debt"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              change < 0 ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 border border-rose-100/50 dark:border-rose-900" :
                              change > 0 ? "bg-slate-50 dark:bg-slate-950/30 text-teal-600 dark:text-slate-200 border border-teal-100/50 dark:border-teal-900" :
                              "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/20 dark:border-slate-700"
                            }`}>
                              Rs {Math.abs(change).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          /* General view */
          <section className="min-h-[calc(100vh-68px)] border-slate-100 dark:border-slate-800 lg:border-r transition-colors">
            <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight" style={{ letterSpacing: "-0.02em" }}>Friends Dashboard</h1>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">All your individual friend balances</p>
              </div>
              <Button label="Add an expense" onClick={() => navigate("/expense")} />
            </div>

            <div className="grid grid-cols-3 gap-px bg-slate-200/50 dark:bg-slate-800 text-center border-b border-slate-100 dark:border-slate-800 shadow-inner transition-colors">
              <div className="bg-white dark:bg-slate-900 px-2 py-4 flex flex-col justify-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">total balance</p>
                <p className={`text-lg font-black leading-none ${dashboardData && dashboardData.totalBalance < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-teal-600 dark:text-white'}`}>
                  Rs {dashboardData ? dashboardData.totalBalance.toFixed(2) : "0.00"}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 px-2 py-4 flex flex-col justify-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">you owe</p>
                <p className="text-lg font-black leading-none text-rose-500 dark:text-rose-400">Rs {dashboardData ? dashboardData.totalYouOwe.toFixed(2) : "0.00"}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 px-2 py-4 flex flex-col justify-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">you are owed</p>
                <p className="text-lg font-black leading-none text-teal-600 dark:text-white">Rs {dashboardData ? dashboardData.totalYouAreOwed.toFixed(2) : "0.00"}</p>
              </div>
            </div>

            <div className="grid min-h-[380px] grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 md:grid-cols-2 md:divide-x md:divide-slate-800 md:divide-y-0">
              {/* You Owe */}
              <div className="px-6 py-6">
                <h2 className="mb-5 text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400" />
                  You owe
                </h2>
                <div className="space-y-3">
                  {!dashboardData || dashboardData.youOweList.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Nothing owed. You are clear.</p>
                    </div>
                  ) : (
                    dashboardData.youOweList.map((friend) => (
                      <div key={friend.name} onClick={() => navigate(`/friends-dashboard?friendName=${encodeURIComponent(friend.name)}`)}
                        className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2.5 rounded-xl border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3 truncate pr-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-sm shrink-0">
                            {friend.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{friend.name}</p>
                        </div>
                        <span className="text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-100/40 dark:border-rose-900 px-2 py-0.5 rounded">{friend.amount}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* You Are Owed */}
              <div className="px-6 py-6">
                <h2 className="mb-5 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400" />
                  You are owed
                </h2>
                <div className="space-y-3">
                  {!dashboardData || dashboardData.youAreOwedList.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-400 dark:text-slate-500">No active balances.</p>
                    </div>
                  ) : (
                    dashboardData.youAreOwedList.map((friend) => (
                      <div key={friend.name} onClick={() => navigate(`/friends-dashboard?friendName=${encodeURIComponent(friend.name)}`)}
                        className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2.5 rounded-xl border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3 truncate pr-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-teal-50/50 dark:bg-teal-950/30 text-teal-600 dark:text-white font-bold text-sm shrink-0">
                            {friend.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{friend.name}</p>
                        </div>
                        <span className="text-xs font-bold text-teal-600 dark:text-white bg-slate-50 dark:bg-slate-950/30 border border-teal-100/40 dark:border-teal-900 px-2 py-0.5 rounded">{friend.amount}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Right ribbon */}
        <aside className="hidden bg-slate-50/50 dark:bg-slate-900/50 px-5 py-7 lg:block transition-colors border-l border-slate-100 dark:border-slate-800">
          <div className="border border-slate-200/40 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Spenva on the go</h2>
                      Settle up
            <div className="mt-4 border border-slate-300 bg-slate-950 px-3 py-2 text-center text-xs font-semibold text-white shadow-sm dark:border-slate-700 dark:bg-slate-900">Mobile app later</div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default FriendsDashboard;




