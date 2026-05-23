import { useState, useEffect } from "react";
import { expenseAPI, friendAPI } from "../../services/api";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Button from "../common/Button";
import { ThemeToggle } from "../common/ThemeToggle";

interface Friend {
  id: number;
  name: string;
  email: string;
}

interface SplitPreview {
  youPay: number;
  friendPays: number;
}

function AddExpense() {
  const navigate = useNavigate();
  const location = useLocation();
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [isNewFriend, setIsNewFriend] = useState(location.state?.newFriend || false);
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [newFriendName, setNewFriendName] = useState("");
  const [newFriendEmail, setNewFriendEmail] = useState("");

  const [yourShares, setYourShares] = useState("1");
  const [friendShares, setFriendShares] = useState("1");
  const [yourAdjustment, setYourAdjustment] = useState("0");
  const [friendAdjustment, setFriendAdjustment] = useState("0");

  const [preview, setPreview] = useState<SplitPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    splitType: "equal",
    paidBy: "you",
    notes: "",
    dateTime: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const response = await friendAPI.getAll();
        setFriendsList(response.data);
      } catch (err) {
        console.error("Error loading friends:", err);
      }
    };
    loadFriends();
  }, []);

  const fetchPreview = async () => {
    const amount = parseFloat(expenseForm.amount);
    if (!amount || amount <= 0) { setPreview(null); return; }
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const res = await expenseAPI.calculate({
        amount,
        splitType: expenseForm.splitType,
        yourShares: parseFloat(yourShares) || 1,
        friendShares: parseFloat(friendShares) || 1,
        yourAdjustment: parseFloat(yourAdjustment) || 0,
        friendAdjustment: parseFloat(friendAdjustment) || 0,
      });
      setPreview(res.data);
    } catch (err: any) {
      setPreviewError(err.response?.data || "Calculation failed");
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [
    expenseForm.splitType,
    expenseForm.amount,
    yourShares,
    friendShares,
    yourAdjustment,
    friendAdjustment,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let friendPayload = {};
      if (isNewFriend) {
        friendPayload = { name: newFriendName.trim(), email: newFriendEmail.toLowerCase().trim() };
      } else {
        if (!selectedFriendId) { alert("Please select a friend."); return; }
        friendPayload = { id: parseInt(selectedFriendId) };
      }

      const localDateTimeString = expenseForm.dateTime.length === 16
        ? `${expenseForm.dateTime}:00` : expenseForm.dateTime;

      await expenseAPI.create({
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        splitType: expenseForm.splitType,
        paidBy: expenseForm.paidBy,
        notes: expenseForm.notes,
        dateTime: localDateTimeString,
        yourShares: parseFloat(yourShares) || 1,
        friendShares: parseFloat(friendShares) || 1,
        yourAdjustment: parseFloat(yourAdjustment) || 0,
        friendAdjustment: parseFloat(friendAdjustment) || 0,
        friend: friendPayload,
      });
      navigate("/Dashboard");
    } catch (error) {
      console.error("Failed to save expense:", error);
    }
  };

  const friendName = isNewFriend
    ? newFriendName.trim() || "Friend"
    : friendsList.find((f) => f.id === parseInt(selectedFriendId))?.name || "Friend";

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white text-slate-950 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/Dashboard" className="text-2xl font-bold tracking-normal">Spenva</Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/Dashboard" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">Cancel</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-2xl p-4">
        <div className="border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 md:p-7">
          <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Add an expense</h1>
          <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">Select a friend and fill in the details.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Friend Selection */}
            <div className="border border-slate-200 bg-slate-50 p-4 transition-colors dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Split Bill With</label>
                <button type="button" onClick={() => setIsNewFriend(!isNewFriend)}
                  className="text-xs font-semibold text-slate-950 dark:text-white hover:underline cursor-pointer">
                  {isNewFriend ? "Choose existing friend" : "+ Add a new friend"}
                </button>
              </div>
              {!isNewFriend ? (
                <select required value={selectedFriendId}
                  onChange={(e) => setSelectedFriendId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 text-sm transition-colors">
                  <option value="">-- Select a Friend --</option>
                  {friendsList.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input type="text" required placeholder="Friend's Name"
                    value={newFriendName} onChange={(e) => setNewFriendName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors" />
                  <input type="email" required placeholder="Email"
                    value={newFriendEmail} onChange={(e) => setNewFriendEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors" />
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">Expense Name</label>
              <input type="text" required placeholder="e.g. Cafe Lunch, Pizza Party"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors" />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">Amount (Rs)</label>
              <input type="number" required min={1} placeholder="0.00"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors" />
            </div>

            {/* Paid By + Split Type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">Paid By</label>
                <select value={expenseForm.paidBy}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 text-sm font-medium transition-colors">
                  <option value="you">You Paid</option>
                  <option value="friend">They Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">Bill Split</label>
                <select value={expenseForm.splitType}
                  onChange={(e) => setExpenseForm({ ...expenseForm, splitType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 text-sm font-medium transition-colors">
                  <option value="equal">Split Equally</option>
                  <option value="you-owe">You Owe Full</option>
                  <option value="they-owe">They Owe Full</option>
                  <option value="shares">Split by Shares</option>
                  <option value="adjustment">Split by Adjustment</option>
                </select>
              </div>
            </div>

            {/* Shares inputs */}
            {expenseForm.splitType === "shares" && (
              <div className="border border-slate-200 bg-slate-50 p-4 transition-colors dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-3">Enter Ratios</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Your Share</label>
                    <input type="number" min={0.1} step={0.1} value={yourShares}
                      onChange={(e) => setYourShares(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{friendName}'s Share</label>
                    <input type="number" min={0.1} step={0.1} value={friendShares}
                      onChange={(e) => setFriendShares(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  Ratio {yourShares}:{friendShares}. You pay {Math.round((parseFloat(yourShares) / (parseFloat(yourShares) + parseFloat(friendShares))) * 100) || 50}%
                </p>
              </div>
            )}

            {/* Adjustment inputs */}
            {expenseForm.splitType === "adjustment" && (
              <div className="border border-slate-200 bg-slate-50 p-4 transition-colors dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">Extra Charges</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Base splits equally. Add personal extras on top.</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Your Extra (Rs)</label>
                    <input type="number" min={0} step={0.01} value={yourAdjustment}
                      onChange={(e) => setYourAdjustment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{friendName}'s Extra (Rs)</label>
                    <input type="number" min={0} step={0.01} value={friendAdjustment}
                      onChange={(e) => setFriendAdjustment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 transition-colors" />
                  </div>
                </div>
              </div>
            )}

            {/* Split Preview */}
            {expenseForm.amount && (
              <div className={`rounded-lg p-3 border text-sm transition-colors ${previewError ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900" : "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900"}`}>
                {previewLoading && <p className="text-slate-400 dark:text-slate-500 text-xs text-center">Calculating...</p>}
                {previewError && !previewLoading && <p className="text-red-600 dark:text-red-400 text-xs font-medium">{previewError}</p>}
                {preview && !previewLoading && !previewError && (
                  <div className="flex justify-around">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">You pay</p>
                      <p className="font-bold text-slate-950 dark:text-white">Rs {preview.youPay.toFixed(2)}</p>
                    </div>
                    <div className="text-slate-300 dark:text-slate-700 self-center text-lg">|</div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{friendName} pays</p>
                      <p className="font-bold text-slate-950 dark:text-white">Rs {preview.friendPays.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">Date & Time</label>
              <input type="datetime-local" required value={expenseForm.dateTime}
                onChange={(e) => setExpenseForm({ ...expenseForm, dateTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 text-sm transition-colors" />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">Notes</label>
              <textarea placeholder="Add optional notes..." value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-950 dark:focus:border-slate-300 text-sm resize-none transition-colors" />
            </div>

            <div className="mt-4 flex gap-4 justify-end">
              <Link to="/Dashboard"
                className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 self-center transition-colors">
                Cancel
              </Link>
              <div className="w-36">
                <Button label="Save Expense" type="submit" />
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AddExpense;



