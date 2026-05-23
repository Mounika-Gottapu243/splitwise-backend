import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import Input from "../components/common/input";
import { ThemeToggle } from "../components/common/ThemeToggle";

function ProfilePage() {
  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem("spenvaUser") || "{}");

  const [profileName, setProfileName] = useState(savedUser.profileName || "");
  const [phone, setPhone] = useState(savedUser.phone || "");
  const [currency, setCurrency] = useState(savedUser.currency || "INR");

  const handleSubmit = () => {
    localStorage.setItem(
      "spenvaUser",
      JSON.stringify({
        ...savedUser,
        profileName,
        phone,
        currency,
      })
    );

    navigate("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#f4f5f7] px-4 transition-colors dark:bg-slate-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md border border-slate-200 bg-white p-8 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-2xl font-bold text-center text-slate-950 dark:text-white mb-6">
          Profile Settings
        </h2>

        <div className="flex flex-col gap-4">
          <Input
            name="profileName"
            type="text"
            placeholder="Profile name"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            required
          />

          <Input
            name="phone"
            type="text"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-green-500 dark:focus:border-slate-300 transition-colors"
          >
            <option value="INR">INR - Indian Rupee</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
          </select>
        </div>

        <div className="mt-6">
          <Button label="Save Profile" onClick={handleSubmit} />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;



