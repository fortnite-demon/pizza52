import { isAxiosError } from "axios";
import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const { login, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = useMemo(
    () => email.trim().length > 0 && password.trim().length >= 6,
    [email, password]
  );

  if (isAuthenticated) {
    return <Navigate to={redirect} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isFormValid) {
      setError("Введите корректный email и пароль (не менее 6 символов).");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate(redirect, { replace: true });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        setError(err.response.data?.detail ?? "Доступ запрещён.");
      } else {
        setError("Неверный email или пароль.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Вход в Pizza52</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-red-600 focus:ring"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-red-600 focus:ring"
              placeholder="Минимум 6 символов"
              minLength={6}
              required
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Входим..." : "Войти"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Нет аккаунта?{" "}
          <Link to="/register" className="font-semibold text-red-600 hover:text-red-700">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </main>
  );
}
