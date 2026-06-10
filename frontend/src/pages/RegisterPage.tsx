import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function isValidRussianPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^[78]\d{10}$/.test(digits);
}

const PHONE_EMPTY = "+7";

function formatPhone(raw: string): string {
  // Strip all non-digits
  let digits = raw.replace(/\D/g, "");

  // Drop leading country code (7 or 8) — we always prepend +7
  if (digits.startsWith("7") || digits.startsWith("8")) {
    digits = digits.slice(1);
  }

  // Limit to 10 subscriber digits
  digits = digits.slice(0, 10);

  // Build "+7 XXX XXX XX XX"
  let result = "+7";
  if (digits.length > 0) result += " " + digits.slice(0, 3);
  if (digits.length > 3) result += " " + digits.slice(3, 6);
  if (digits.length > 6) result += " " + digits.slice(6, 8);
  if (digits.length > 8) result += " " + digits.slice(8, 10);

  return result;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(PHONE_EMPTY);
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = useMemo(() => {
    const phoneOk = phone === PHONE_EMPTY || isValidRussianPhone(phone);
    return (
      name.trim().length >= 2 &&
      isValidEmail(email) &&
      phoneOk &&
      password.trim().length >= 6 &&
      password.trim().length <= 72
    );
  }, [name, email, phone, password]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setEmailError("Введите корректный email.");
      return;
    }
    if (phone !== PHONE_EMPTY && !isValidRussianPhone(phone)) {
      setPhoneError("Введите полный номер: +7 XXX XXX XX XX.");
      return;
    }
    if (!isFormValid) {
      setError("Проверьте заполненные поля.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone !== PHONE_EMPTY ? phone : undefined,
        password: password.trim(),
      });
      navigate("/");
    } catch {
      setError("Не удалось зарегистрироваться. Возможно, email уже занят.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Регистрация в Pizza52</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-red-600 focus:ring"
              placeholder="Ваше имя"
              minLength={2}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError("");
              }}
              className={`w-full rounded-lg border px-3 py-2 outline-none ring-red-600 focus:ring ${
                emailError ? "border-red-400" : "border-slate-300"
              }`}
              placeholder="you@example.com"
              required
            />
            {emailError && (
              <p className="mt-1 text-xs font-medium text-red-600">{emailError}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Телефон <span className="text-slate-400">(необязательно)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => {
                setPhone(formatPhone(event.target.value));
                setPhoneError("");
              }}
              className={`w-full rounded-lg border px-3 py-2 outline-none ring-red-600 focus:ring ${
                phoneError ? "border-red-400" : "border-slate-300"
              }`}
            />
            {phoneError && (
              <p className="mt-1 text-xs font-medium text-red-600">{phoneError}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-red-600 focus:ring"
              placeholder="6-72 символа"
              minLength={6}
              maxLength={72}
              required
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Регистрируем..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="font-semibold text-red-600 hover:text-red-700">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
