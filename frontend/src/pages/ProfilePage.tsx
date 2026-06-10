import axios from "axios";
import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { updatePasswordApi, updateProfileApi } from "../api/auth";
import { useAuthStore } from "../store/useAuthStore";

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuthStore();

  // --- Profile form ---
  const [name, setName] = useState(user?.name ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // --- Password form ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);
    setProfileSaving(true);

    try {
      const result = await updateProfileApi({
        name: name.trim(),
        email: user.email,
        phone: user.phone ?? "",
      });
      updateUser({ name: result.name, email: result.email, phone: result.phone }, result.new_token);
      setProfileSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setProfileError("Не удалось сохранить изменения. Попробуйте ещё раз.");
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setConfirmError("");
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("Новый пароль должен содержать минимум 6 символов.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError("Пароли не совпадают.");
      return;
    }

    setPasswordSaving(true);
    try {
      await updatePasswordApi({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail ?? "";
        if (detail === "Current password is incorrect") {
          setPasswordError("Текущий пароль указан неверно.");
        } else {
          setPasswordError("Не удалось сменить пароль. Попробуйте ещё раз.");
        }
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Личный кабинет</h1>

      {/* Profile section */}
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-bold text-slate-900">Личные данные</h2>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-red-600 focus:ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-500">Email</label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
            />
            <p className="mt-1 text-xs text-slate-400">Email нельзя изменить</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-500">Телефон</label>
            <input
              type="tel"
              value={user.phone ?? "—"}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
            />
            <p className="mt-1 text-xs text-slate-400">Телефон нельзя изменить</p>
          </div>

          {profileError && (
            <p className="text-sm font-medium text-red-600">{profileError}</p>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={profileSaving}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {profileSaving ? "Сохраняем..." : "Сохранить изменения"}
            </button>
            {profileSuccess && (
              <p className="text-sm font-medium text-green-600">
                Данные успешно сохранены ✓
              </p>
            )}
          </div>
        </form>
      </section>

      {/* Password section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-bold text-slate-900">Смена пароля</h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Текущий пароль
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordError("");
              }}
              required
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ring-red-600 focus:ring ${
                passwordError ? "border-red-400" : "border-slate-300"
              }`}
            />
            {passwordError && (
              <p className="mt-1 text-xs font-medium text-red-600">{passwordError}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Новый пароль
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
              placeholder="Минимум 6 символов"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-red-600 focus:ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Повторите новый пароль
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmError("");
              }}
              required
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ring-red-600 focus:ring ${
                confirmError ? "border-red-400" : "border-slate-300"
              }`}
            />
            {confirmError && (
              <p className="mt-1 text-xs font-medium text-red-600">{confirmError}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={passwordSaving}
              className="rounded-xl border-2 border-red-600 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {passwordSaving ? "Меняем..." : "Сменить пароль"}
            </button>
            {passwordSuccess && (
              <p className="text-sm font-medium text-green-600">
                Пароль успешно изменён ✓
              </p>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
