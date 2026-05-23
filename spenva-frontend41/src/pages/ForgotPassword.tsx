import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import Button from "../components/common/Button";
import Input from "../components/common/input";
import { ThemeToggle } from "../components/common/ThemeToggle";

type Step = "EMAIL" | "OTP" | "RESET";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("");
    setIsSuccess(false);
    setLoading(true);

    try {
      await authAPI.sendOtp(email);
      setIsSuccess(true);
      setStatusMessage("OTP code sent successfully. Check your email!");
      setStep("OTP");
    } catch (error: any) {
      setStatusMessage(error.response?.data || "Failed to send OTP. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("");
    setIsSuccess(false);
    setLoading(true);

    try {
      const res = await authAPI.verifyOtp(email, otp);
      setToken(res.data.token);
      setIsSuccess(true);
      setStatusMessage("OTP verified successfully. Please enter your new password.");
      setStep("RESET");
    } catch (error: any) {
      setStatusMessage(error.response?.data || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("");
    setIsSuccess(false);

    if (newPassword !== confirmPassword) {
      setStatusMessage("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, newPassword);
      setIsSuccess(true);
      setStatusMessage("Password reset successful! Redirecting to login page...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      setStatusMessage(error.response?.data || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white text-slate-950 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/login" className="text-2xl font-bold tracking-normal">
            Spenva
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center bg-slate-950 text-2xl font-bold text-white transition-colors dark:bg-white dark:text-slate-950">
              S
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Forgot Password</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {step === "EMAIL" && "Enter your email to receive a 6-digit OTP code."}
              {step === "OTP" && `Enter the OTP sent to ${email}`}
              {step === "RESET" && "Choose a secure new password."}
            </p>
          </div>

          {statusMessage && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm text-center font-semibold transition-colors ${
                isSuccess
                  ? "bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-slate-200 border border-teal-200 dark:border-teal-900"
                  : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900"
              }`}
            >
              {statusMessage}
            </div>
          )}

          {step === "EMAIL" && (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <Input
                name="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button
                label={loading ? "Sending OTP..." : "Send OTP"}
                type="submit"
                variant="primary"
              />
            </form>
          )}

          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <Input
                name="otp"
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <Button
                label={loading ? "Verifying..." : "Verify OTP"}
                type="submit"
                variant="primary"
              />
            </form>
          )}

          {step === "RESET" && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <Input
                name="newPassword"
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                label={loading ? "Resetting..." : "Reset Password"}
                type="submit"
                variant="primary"
              />
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="font-semibold text-slate-700 dark:text-white hover:text-slate-950 dark:hover:text-slate-200 transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ForgotPasswordPage;



