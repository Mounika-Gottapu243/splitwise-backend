import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { friendAPI, authAPI, groupAPI } from "../services/api";
import { ThemeToggle } from "../components/common/ThemeToggle";

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

interface Member {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  paidBy: string;
  amount: string;
  description: string;
  splitAmong: string[];
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

type Step = "members" | "expenses" | "result";

// How-it-works steps
const HOW_IT_WORKS = [
  { icon: "01", title: "Add members", desc: "Name everyone in the group." },
  { icon: "02", title: "Log expenses", desc: "Who paid? How much? Split how?" },
  { icon: "03", title: "Get settlements", desc: "Spenva minimises the transactions needed." },
];

function GroupDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlGroupName = searchParams.get("groupName");

  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const [step, setStep] = useState<Step>("members");
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<Member[]>([
    { id: "1", name: "" },
    { id: "2", name: "" },
  ]);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: "1", paidBy: "", amount: "", description: "", splitAmong: [] },
  ]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("spenvaUser") || "null") as {
    name?: string;
    profileName?: string;
    email?: string;
  } | null;

  const storedGroupsData = localStorage.getItem("spenva_groups_data");
  const groupsData = storedGroupsData ? JSON.parse(storedGroupsData) : [];
  const activeGroup = groupsData.find((g: any) => g.name === urlGroupName);

  useEffect(() => {
    if (urlGroupName) {
      setGroupName(urlGroupName);
      if (activeGroup) {
        setMembers(activeGroup.members || []);
        setExpenses(activeGroup.expenses || []);
        setSettlements(activeGroup.settlements || []);
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    } else {
      setIsEditing(true);
    }
  }, [urlGroupName]);

  const fetchSidebarData = async () => {
    try {
      const response = await friendAPI.getBalances();
      setDashboardData(response.data);
      const storedGroups = localStorage.getItem("spenva_groups");
      setGroups(storedGroups ? JSON.parse(storedGroups) : []);
    } catch (err) {
      console.error("Error loading sidebar data:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchSidebarData();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const profileName = user.profileName || user.name || "User";
  const initial = profileName.charAt(0).toUpperCase();

  const handleLogout = () => {
    authAPI.logout();
    sessionStorage.clear();
    navigate("/login");
  };

  const addMember = () => setMembers([...members, { id: Date.now().toString(), name: "" }]);
  const updateMember = (id: string, name: string) => setMembers(members.map((m) => (m.id === id ? { ...m, name } : m)));
  const removeMember = (id: string) => {
    if (members.length <= 2) return;
    setMembers(members.filter((m) => m.id !== id));
    setExpenses(expenses.map((e) => ({
      ...e,
      splitAmong: e.splitAmong.filter((mid) => mid !== id),
      paidBy: e.paidBy === id ? "" : e.paidBy,
    })));
  };

  const addExpense = () => setExpenses([...expenses, { id: Date.now().toString(), paidBy: "", amount: "", description: "", splitAmong: [] }]);
  const updateExpense = (id: string, field: keyof Expense, value: any) =>
    setExpenses(expenses.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  const toggleSplitMember = (expenseId: string, memberId: string) =>
    setExpenses(expenses.map((e) => {
      if (e.id !== expenseId) return e;
      const already = e.splitAmong.includes(memberId);
      return { ...e, splitAmong: already ? e.splitAmong.filter((id) => id !== memberId) : [...e.splitAmong, memberId] };
    }));
  const removeExpense = (id: string) => {
    if (expenses.length <= 1) return;
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const validMembers = members.filter((m) => m.name.trim() !== "");
  const canProceed = validMembers.length >= 2 && groupName.trim() !== "";
  const canCalculate = expenses.every((e) => e.paidBy !== "" && parseFloat(e.amount) > 0 && e.description.trim() !== "");

  const calculate = async () => {
    setError("");
    setLoading(true);
    try {
      const payload = {
        groupName: groupName.trim(),
        members: validMembers,
        expenses: expenses.map((e) => ({
          paidBy: e.paidBy,
          amount: parseFloat(e.amount),
          description: e.description,
          splitAmong: e.splitAmong,
        })),
      };
      const res = await groupAPI.calculate(payload);
      setSettlements(res.data);
      setStep("result");

      const stored = localStorage.getItem("spenva_groups");
      const currentGroups = stored ? JSON.parse(stored) : [];
      if (!currentGroups.includes(groupName.trim())) {
        currentGroups.push(groupName.trim());
        localStorage.setItem("spenva_groups", JSON.stringify(currentGroups));
      }

      const fullGroup = {
        name: groupName.trim(),
        members: validMembers,
        expenses: expenses.map(e => ({
          ...e,
          paidByName: validMembers.find(m => m.id === e.paidBy)?.name || "Unknown"
        })),
        settlements: res.data
      };
      const storedData = localStorage.getItem("spenva_groups_data");
      const currentData = storedData ? JSON.parse(storedData) : [];
      const filteredData = currentData.filter((g: any) => g.name !== groupName.trim());
      filteredData.push(fullGroup);
      localStorage.setItem("spenva_groups_data", JSON.stringify(filteredData));
    } catch (err) {
      setError("Failed to calculate. Please check all fields and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f4f5f7] text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
      
    >
      <header className="border-b border-slate-200 bg-white text-slate-950 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/dashboard" className="text-2xl font-bold tracking-normal" >Spenva</Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="relative">
              <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 border border-slate-300 bg-white px-2 py-1 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900">
                <span className="flex h-9 w-9 items-center justify-center bg-slate-950 text-sm font-bold text-white dark:bg-white dark:text-slate-950">{initial}</span>
                <span className="hidden text-sm font-medium md:block">{profileName}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 text-slate-700 dark:text-slate-200 shadow-lg">
                  <Link to="/setting" className="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Your account</Link>
                  <button type="button" onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Log out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-60px)] max-w-7xl grid-cols-1 gap-0 border-x border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_200px]">

        {/* Left Sidebar */}
        <aside className="border-b border-slate-200 bg-slate-50 px-4 py-5 transition-colors dark:border-slate-800 dark:bg-slate-900/50 md:min-h-[calc(100vh-60px)] md:border-b-0 md:border-r">
          <nav className="space-y-1">
            <Link
              className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 dark:hover:text-white transition-colors rounded-lg"
              to="/dashboard"
            >
              Dashboard
            </Link>
          </nav>

          {/* How it works */}
          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">How group split works</p>
            {HOW_IT_WORKS.map((step) => (
              <div key={step.title} className="flex items-start gap-2.5">
                <span className="text-base leading-none mt-0.5">{step.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{step.title}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Group count badge */}
          <div className="mt-5 flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/40 px-3 py-2.5">
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Total groups</span>
            <span className="text-sm font-black text-slate-700 dark:text-white">{groups.length}</span>
          </div>

          {/* Groups list */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-950 dark:text-white">
              <Link to="/group-dashboard" className="border-l-4 border-slate-950 dark:border-white pl-2 font-bold transition-colors">Groups</Link>
              <button onClick={() => navigate("/group")} className="text-slate-950 dark:text-white cursor-pointer">+ add</button>
            </div>
            <div className="mt-3 space-y-1">
              {groups.length === 0
                ? <p className="text-xs text-slate-400 dark:text-slate-500 px-3">No groups created yet.</p>
                : groups.map((group) => (
                  <button
                    key={group}
                    onClick={() => navigate(`/group-dashboard?groupName=${encodeURIComponent(group)}`)}
                    className={`block w-full rounded px-3 py-2 text-left text-sm cursor-pointer transition-colors ${
                      urlGroupName === group
                        ? "font-semibold text-slate-950 dark:text-white bg-white dark:bg-slate-800 border-l-2 border-slate-950 dark:border-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800/50"
                    }`}
                  >{group}</button>
                ))
              }
            </div>
          </div>

          {/* Friends quick link */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400 dark:text-slate-500">
              <Link to="/friends-dashboard" className="hover:underline hover:text-slate-950 dark:hover:text-white transition-colors">Friends</Link>
              <button onClick={() => navigate("/expense", { state: { newFriend: true } })} className="text-slate-950 dark:text-white cursor-pointer">+ add</button>
            </div>
            <div className="mt-3 space-y-1">
              {!dashboardData || (dashboardData.youOweList.length === 0 && dashboardData.youAreOwedList.length === 0) ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 px-3">No active friends recorded.</p>
              ) : (
                <>
                  {dashboardData.youAreOwedList.map((f) => (
                    <button key={f.name} onClick={() => navigate(`/friends-dashboard?friendName=${encodeURIComponent(f.name)}`)} className="block w-full rounded px-3 py-2 text-left text-sm text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800/50 transition-colors cursor-pointer">{f.name}</button>
                  ))}
                  {dashboardData.youOweList.map((f) => (
                    <button key={f.name} onClick={() => navigate(`/friends-dashboard?friendName=${encodeURIComponent(f.name)}`)} className="block w-full rounded px-3 py-2 text-left text-sm text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800/50 transition-colors cursor-pointer">{f.name}</button>
                  ))}
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main Section */}
        <section className="min-w-0 border-slate-200 p-5 transition-colors dark:border-slate-800 xl:border-r md:p-7">
          {isEditing ? (
            <>
              <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 md:flex-row md:items-center md:justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ letterSpacing: "-0.02em" }}>Group Dashboard</h1>
              </div>

              <div className="border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-900 md:p-7">
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-6">
                  {["members", "expenses", "result"].map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors
                        ${step === s ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950" : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                        {i + 1}
                      </div>
                      <span className={`text-xs font-semibold capitalize transition-colors ${step === s ? "text-slate-950 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>{s}</span>
                      {i < 2 && <div className="h-px w-6 bg-slate-200 dark:bg-slate-800" />}
                    </div>
                  ))}
                </div>

                {/* STEP 1 */}
                {step === "members" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create a Group Split</h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add a name and at least 2 members.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-1">Group Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Goa Trip, Flat Expenses"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-2">Members</label>
                      <div className="flex flex-col gap-2">
                        {members.map((m, idx) => (
                          <div key={m.id} className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold shrink-0 transition-colors">
                              {String.fromCharCode(65 + idx)}
                            </div>
                            <input
                              type="text"
                              placeholder={`Member ${idx + 1}`}
                              value={m.name}
                              onChange={(e) => updateMember(m.id, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors"
                            />
                            {members.length > 2 && (
                              <button type="button" onClick={() => removeMember(m.id)} className="text-slate-400 hover:text-red-500 text-lg font-bold cursor-pointer">x</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addMember} className="mt-3 text-sm font-medium text-slate-950 dark:text-white hover:underline cursor-pointer">+ Add member</button>
                    </div>
                    <button
                      type="button"
                      disabled={!canProceed}
                      onClick={() => setStep("expenses")}
                      className="mt-2 w-full rounded-lg bg-slate-950 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-slate-950 disabled:opacity-40 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      Next: Add Expenses
                    </button>
                  </div>
                )}

                {/* STEP 2 */}
                {step === "expenses" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{groupName}</h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Log who paid what. Leave split blank to divide equally.</p>
                    </div>
                    {expenses.map((expense, idx) => (
                      <div key={expense.id} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 flex flex-col gap-3 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Expense {idx + 1}</span>
                          {expenses.length > 1 && (
                            <button type="button" onClick={() => removeExpense(expense.id)} className="text-xs text-red-400 hover:text-red-600 font-medium cursor-pointer">Remove</button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Description (e.g. Hotel, Dinner)"
                          value={expense.description}
                          onChange={(e) => updateExpense(expense.id, "description", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors"
                        />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">Paid by</label>
                            <select
                              value={expense.paidBy}
                              onChange={(e) => updateExpense(expense.id, "paidBy", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors"
                            >
                              <option value="">-- Select --</option>
                              {validMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">Amount (Rs)</label>
                            <input
                              type="number"
                              min={1}
                              placeholder="0.00"
                              value={expense.amount}
                              onChange={(e) => updateExpense(expense.id, "amount", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 dark:text-slate-500 mb-2">Split among (leave blank = all members)</label>
                          <div className="flex flex-wrap gap-2">
                            {validMembers.map((m) => {
                              const selected = expense.splitAmong.includes(m.id);
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => toggleSplitMember(expense.id, m.id)}
                                  className={`px-3 py-1 text-xs font-medium border transition-colors cursor-pointer
                                    ${selected
                                      ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white"
                                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-950 dark:hover:border-teal-500"
                                    }`}
                                >
                                  {m.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addExpense} className="text-sm font-medium text-slate-950 dark:text-white hover:underline text-left cursor-pointer">
                      + Add another expense
                    </button>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex gap-3 mt-2">
                      <button type="button" onClick={() => setStep("members")} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">Back</button>
                      <button type="button" disabled={!canCalculate || loading} onClick={calculate} className="flex-1 rounded-lg bg-slate-950 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-slate-950 disabled:opacity-40 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all cursor-pointer">
                        {loading ? "Calculating..." : "Calculate Settlements"}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {step === "result" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settlements</h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {groupName} - {settlements.length} transaction{settlements.length !== 1 ? "s" : ""} needed
                      </p>
                    </div>
                    {settlements.length === 0 ? (
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-950/20 border border-teal-200 dark:border-teal-900 p-4 text-center transition-colors">
                        <p className="text-teal-800 dark:text-slate-200 font-semibold">Everyone is settled up.</p>
                        <p className="text-xs text-teal-600 dark:text-white mt-1">No payments needed.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {settlements.map((s, idx) => (
                          <div key={idx} className="grid grid-cols-1 gap-3 border border-slate-200 bg-slate-50 px-4 py-3 transition-colors dark:border-slate-800 dark:bg-slate-950/40 sm:grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] sm:items-center">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-red-100 text-sm font-bold text-red-600 transition-colors dark:bg-red-950/30 dark:text-red-400">{s.from.charAt(0).toUpperCase()}</div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{s.from}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">pays</p>
                              </div>
                            </div>
                            <div className="border-y border-slate-200 py-2 text-left dark:border-slate-800 sm:border-x sm:border-y-0 sm:px-3 sm:py-0 sm:text-center">
                              <p className="text-base font-bold text-slate-950 dark:text-white">Rs {s.amount.toFixed(2)}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">to</p>
                            </div>
                            <div className="flex min-w-0 items-center gap-3 sm:justify-end">
                              <div className="min-w-0 sm:text-right">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{s.to}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">receives</p>
                              </div>
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-slate-200 text-sm font-bold text-slate-700 transition-colors dark:bg-slate-800 dark:text-white">{s.to.charAt(0).toUpperCase()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 mt-2">
                      <button type="button" onClick={() => { setStep("expenses"); setSettlements([]); }} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">Edit Expenses</button>
                      <button
                        type="button"
                        onClick={() => {
                          setStep("members");
                          setGroupName("");
                          setMembers([{ id: "1", name: "" }, { id: "2", name: "" }]);
                          setExpenses([{ id: "1", paidBy: "", amount: "", description: "", splitAmong: [] }]);
                          setSettlements([]);
                          setIsEditing(false);
                          fetchSidebarData();
                        }}
                        className="flex-1 rounded-lg bg-slate-950 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all cursor-pointer"
                      >
                      Settle up
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ letterSpacing: "-0.02em" }}>{activeGroup.name}</h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activeGroup.members.map((m: any) => (
                      <span key={m.id} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition-colors">
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer">Edit / Log Split</button>
                  <button
                    onClick={() => {
                      setGroupName("");
                      setMembers([{ id: "1", name: "" }, { id: "2", name: "" }]);
                      setExpenses([{ id: "1", paidBy: "", amount: "", description: "", splitAmong: [] }]);
                      setSettlements([]);
                      setIsEditing(true);
                      navigate("/group-dashboard");
                    }}
                    className="px-4 py-2 text-sm font-semibold text-white bg-slate-950 dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 rounded transition-all cursor-pointer"
                  >
                    New Group Split
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Expense Ledger */}
                <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-xl bg-white dark:bg-slate-900 transition-colors">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 transition-colors">Group Expense Ledger</h2>
                  {activeGroup.expenses.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">No logged expenses yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {activeGroup.expenses.map((exp: any) => (
                        <div key={exp.id} className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-b-0 last:pb-0 flex items-center justify-between transition-colors">
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{exp.description}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              Paid by <span className="font-medium text-slate-600 dark:text-slate-300">{exp.paidByName}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-950 dark:text-white">Rs {parseFloat(exp.amount).toFixed(2)}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                              {exp.splitAmong.length === 0 ? "Split equally" : `Split among ${exp.splitAmong.length}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Settlements */}
                <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-xl bg-white dark:bg-slate-900 transition-colors">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 transition-colors">Optimized Settlements</h2>
                  {activeGroup.settlements.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-950/20 border border-teal-200 dark:border-teal-900 p-4 rounded text-center transition-colors">
                      <p className="text-teal-800 dark:text-slate-200 font-semibold">Everyone is settled up.</p>
                      <p className="text-xs text-teal-600 dark:text-white mt-1">No pending payments.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeGroup.settlements.map((s: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-1 gap-3 border border-slate-200 bg-slate-50 p-3 transition-colors dark:border-slate-800 dark:bg-slate-950/30 sm:grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] sm:items-center">
                          <div className="min-w-0">
                            <span className="mr-2 border border-red-100 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">Owes</span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{s.from}</span>
                          </div>
                          <div className="text-center shrink-0 px-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Rs {s.amount.toFixed(2)}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 block">to</span>
                          </div>
                          <div className="min-w-0 sm:text-right">
                            <span className="mr-2 border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-white">Receives</span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{s.to}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right sidebar */}
        <aside className="hidden border-l border-slate-200 bg-slate-50 px-5 py-7 transition-colors dark:border-slate-800 dark:bg-slate-900/50 xl:block">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Spenva on the go</h2>
          <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-300">Track shared balances, add IOUs, and settle up with friends from anywhere.</p>
          <div className="mt-5 rounded-md bg-slate-950 dark:bg-slate-800 px-4 py-3 text-center text-xs font-semibold text-white dark:text-slate-100 shadow-sm">Mobile app later</div>
        </aside>
      </main>
    </div>
  );
}

export default GroupDashboard;





