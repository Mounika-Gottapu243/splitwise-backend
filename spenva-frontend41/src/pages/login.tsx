import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import Button from "../components/common/Button";
import Input from "../components/common/input";
import { ThemeToggle } from "../components/common/ThemeToggle";

interface Form {
  email: string;
  password: string;
  confirmPassword: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [form, setForm] = useState<Form>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMessage("");
    setIsSuccess(false);

    if (!isLogin && form.password !== form.confirmPassword) {
      setStatusMessage("Passwords do not match!");
      return;
    }

    try {
      if (isLogin) {

        await authAPI.login({
          email: form.email,
          password: form.password,
        });
        setIsSuccess(true);
        setStatusMessage("Login successful!");
        setTimeout(() => navigate("/dashboard"), 1000);

      } else {

        await authAPI.register({
          email: form.email,
          password: form.password,
        });
        setIsSuccess(true);
        setStatusMessage("Registration successful! Please log in.");
        setIsLogin(true);
        setForm({ email: form.email, password: "", confirmPassword: "" });
      }
    } catch (error: any) {
      const backendError = error.response?.data || "Connection to backend server failed.";
      setStatusMessage(backendError);
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

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Manage shared expenses with friends.
            </p>
          </div>

          {/* Context Response Status Feedback Banner View */}
          {statusMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm text-center font-semibold transition-colors ${
              isSuccess 
                ? "bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-slate-200 border border-teal-200 dark:border-teal-900" 
                : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900"
            }`}>
              {statusMessage}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              name="email"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              required
            />

            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />

            {isLogin && (
              <div className="flex justify-end -mt-2">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-slate-700 dark:text-white hover:text-slate-950 dark:hover:text-slate-200 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            )}


            {!isLogin && (
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            )}

            <Button
              label={isLogin ? "Log In" : "Sign Up"}
              type="submit"
              variant="primary"
            />
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setStatusMessage("");
              }}
              className="font-semibold text-slate-700 dark:text-white hover:text-slate-950 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;


