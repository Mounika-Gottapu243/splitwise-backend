import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { Code2, ShieldCheck } from "lucide-react";

const developers = [
  {
    name: "Mounika.G",
    role: "Frontend Developer",
    bio: "Mounika builds the product interface for SPENVA, focusing on responsive screens, visual consistency, and clear user flows.",
    icon: Code2,
  },
  {
    name: "Utpreksha.G",
    role: "Backend & Logic Developer",
    bio: "Utpreksha builds the expense logic, APIs, and debt minimization workflows that keep shared balances accurate.",
    icon: ShieldCheck,
  },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="border-b border-slate-200 bg-white px-6 py-4 transition-colors dark:border-slate-800 dark:bg-slate-950 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-left text-2xl font-bold tracking-normal text-slate-950 dark:text-white">
            SPENVA
          </p>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {/* Login → /login | Signup → /signup */}
            <Button label="Login" variant="secondary" onClick={() => navigate("/login")} />
            <Button label="Signup" onClick={() => navigate("/signup")} />
          </div>
        </div>
      </div>

      <main className="min-h-screen bg-[#f4f5f7] transition-colors dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-14 md:px-10">
          <section className="border-b border-slate-300 pb-12 text-left dark:border-slate-800">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Shared expense management
            </p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-normal text-slate-950 dark:text-white md:text-6xl">
              Spenva
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-7 text-slate-700 dark:text-slate-300">
              Track shared spending, split costs clearly, and settle balances without turning finance into a group chat argument.
            </p>

            <div className="mt-8 flex w-full max-w-sm gap-3">
              {/* Hero CTA: Create account → /signup | Log in → /login */}
              <Button label="Create account" onClick={() => navigate("/signup")} />
              <Button label="Log in" variant="secondary" onClick={() => navigate("/login")} />
            </div>
          </section>

          <section className="mt-14">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
                Built by
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                A small product team focused on practical expense sharing and reliable settlement logic.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {developers.map((developer) => {
                const Icon = developer.icon;
                return (
                  <div
                    key={developer.name}
                    className="border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="mb-6 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center border border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                        <Icon className="h-6 w-6 text-slate-800 dark:text-slate-200" />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                          {developer.name}
                        </h3>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {developer.role}
                        </p>
                      </div>
                    </div>

                    <p className="leading-7 text-slate-700 dark:text-slate-300">
                      {developer.bio}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
              Meaning of SPENVA
            </h2>

            <div className="mt-6 max-w-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-base leading-7 text-slate-800 dark:text-slate-200">
                <span className="font-bold text-slate-950 dark:text-white">
                  SPENVA
                </span>{" "}
                comes from <span className="font-semibold">Spend</span> +{" "}
                <span className="font-semibold">Patava</span>
                <span className="text-slate-500 dark:text-slate-400">:</span>{" "}
                where <span className="font-semibold">Patava</span> is a Sanskrit
                word meaning skill, cleverness, and dexterity.
              </p>

              <p className="mt-4 text-slate-700 dark:text-slate-300">
                The name reflects a smart and skilled way to manage shared
                expenses with ease.
              </p>
            </div>
          </section>

          <p className="mt-14 border-t border-slate-300 pt-6 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
            Copyright (c) 2026 SPENVA. All rights reserved.
          </p>
        </div>
      </main>
    </>
  );
};

export default HomePage;