import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { groupAPI } from "../services/api";
import { ThemeToggle } from "../components/common/ThemeToggle";

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

function GroupSplit() {
  const navigate = useNavigate();
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

  // --- Member helpers ---
  const addMember = () => {
    setMembers([...members, { id: Date.now().toString(), name: "" }]);
  };

  const updateMember = (id: string, name: string) => {
    setMembers(members.map((m) => (m.id === id ? { ...m, name } : m)));
  };

  const removeMember = (id: string) => {
    if (members.length <= 2) return;
    setMembers(members.filter((m) => m.id !== id));
    setExpenses(expenses.map((e) => ({
      ...e,
      splitAmong: e.splitAmong.filter((mid) => mid !== id),
      paidBy: e.paidBy === id ? "" : e.paidBy,
    })));
  };

  // --- Expense helpers ---
  const addExpense = () => {
    setExpenses([...expenses, {
      id: Date.now().toString(), paidBy: "", amount: "", description: "", splitAmong: [],
    }]);
  };

  const updateExpense = (id: string, field: keyof Expense, value: any) => {
    setExpenses(expenses.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const toggleSplitMember = (expenseId: string, memberId: string) => {
    setExpenses(expenses.map((e) => {
      if (e.id !== expenseId) return e;
      const already = e.splitAmong.includes(memberId);
      return {
        ...e,
        splitAmong: already
          ? e.splitAmong.filter((id) => id !== memberId)
          : [...e.splitAmong, memberId],
      };
    }));
  };

  const removeExpense = (id: string) => {
    if (expenses.length <= 1) return;
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  // --- Validation ---
  const validMembers = members.filter((m) => m.name.trim() !== "");
  const canProceed = validMembers.length >= 2 && groupName.trim() !== "";
  const canCalculate = expenses.every(
    (e) => e.paidBy !== "" && parseFloat(e.amount) > 0 && e.description.trim() !== ""
  );

  // --- Submit to backend ---
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
          splitAmong: e.splitAmong, // empty = split among all
        })),
      };
      const res = await groupAPI.calculate(payload);
      setSettlements(res.data);
      setStep("result");

      // Save group to localStorage
      const stored = localStorage.getItem("spenva_groups");
      const currentGroups = stored ? JSON.parse(stored) : [];
      if (!currentGroups.includes(groupName.trim())) {
        currentGroups.push(groupName.trim());
        localStorage.setItem("spenva_groups", JSON.stringify(currentGroups));
      }

      // Save full group data structure
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
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white text-slate-950 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="text-2xl font-bold tracking-normal">Spenva</Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/dashboard" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">Cancel</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-xl p-4">
        <div className="border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {["members", "expenses", "result"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors
                  ${step === s ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950" : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-semibold capitalize transition-colors ${step === s ? "text-slate-950 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                  {s}
                </span>
                {i < 2 && <div className="h-px w-6 bg-slate-200 dark:bg-slate-800" />}
              </div>
            ))}
          </div>

          {/* STEP 1: Members */}
          {step === "members" && (
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create a Group</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add a name and at least 2 members.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Goa Trip, Flat Expenses"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-2">Members</label>
                <div className="flex flex-col gap-2">
                  {members.map((m, idx) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold shrink-0 transition-colors">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <input
                        type="text"
                        placeholder={`Member ${idx + 1} name`}
                        value={m.name}
                        onChange={(e) => updateMember(m.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors"
                      />
                      {members.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeMember(m.id)}
                          className="text-slate-400 hover:text-red-500 text-lg font-bold cursor-pointer"
                        >
                          x
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addMember}
                  className="mt-3 text-sm font-semibold text-slate-950 dark:text-white hover:underline cursor-pointer"
                >
                  + Add member
                </button>
              </div>

              <button
                type="button"
                disabled={!canProceed}
                onClick={() => setStep("expenses")}
                className="mt-2 w-full rounded-lg bg-slate-950 dark:bg-white px-4 py-2 text-sm font-bold text-white dark:text-slate-950 disabled:opacity-40 hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer transition-colors"
              >
                      Next: Add Expenses
              </button>
            </div>
          )}

          {/* STEP 2: Expenses */}
          {step === "expenses" && (
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{groupName}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Log who paid what. Leave split blank to divide equally among all.</p>
              </div>

              {expenses.map((expense, idx) => (
                <div key={expense.id} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 flex flex-col gap-3 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Expense {idx + 1}</span>
                    {expenses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExpense(expense.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Description (e.g. Hotel, Dinner)"
                    value={expense.description}
                    onChange={(e) => updateExpense(expense.id, "description", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">Paid by</label>
                      <select
                        value={expense.paidBy}
                        onChange={(e) => updateExpense(expense.id, "paidBy", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors"
                      >
                        <option value="">-- Select --</option>
                        {validMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
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
                    <label className="block text-xs text-slate-400 dark:text-slate-500 mb-2">
                      Split among <span className="text-slate-400 dark:text-slate-500">(leave blank = all members)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {validMembers.map((m) => {
                        const selected = expense.splitAmong.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleSplitMember(expense.id, m.id)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer
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

              <button
                type="button"
                onClick={addExpense}
                className="text-sm font-semibold text-slate-950 dark:text-white hover:underline text-left cursor-pointer"
              >
                + Add another expense
              </button>

              {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setStep("members")}
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!canCalculate || loading}
                  onClick={calculate}
                  className="flex-1 rounded-lg bg-slate-950 dark:bg-white px-4 py-2 text-sm font-bold text-white dark:text-slate-950 disabled:opacity-40 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {loading ? "Calculating..." : "Calculate Settlements"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Result */}
          {step === "result" && (
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settlements</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {groupName} - Optimized to {settlements.length} transaction{settlements.length !== 1 ? "s" : ""}
                </p>
              </div>

              {settlements.length === 0 ? (
                <div className="rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 p-4 text-center transition-colors">
                  <p className="text-teal-800 dark:text-teal-350 font-semibold">Everyone is settled up.</p>
                  <p className="text-xs text-teal-600 dark:text-white mt-1">No payments needed.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {settlements.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 py-3 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-bold transition-colors">
                          {s.from.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.from}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">pays</p>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-base font-bold text-slate-950 dark:text-white">Rs {s.amount.toFixed(2)}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">to</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.to}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">receives</p>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950/30 text-teal-600 dark:text-white text-sm font-bold transition-colors">
                          {s.to.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("expenses");
                    setSettlements([]);
                  }}
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Edit Expenses
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 rounded-lg bg-slate-950 dark:bg-white px-4 py-2 text-sm font-bold text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default GroupSplit;




