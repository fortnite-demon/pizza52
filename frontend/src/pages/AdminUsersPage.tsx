import { useEffect, useState } from "react";
import { type AdminUser, getUsersApi, toggleUserBlockApi, updateUserRoleApi } from "../api/admin";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import type { UserRole } from "../types";

const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Покупатель",
  admin: "Админ",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingId, setChangingId] = useState<number | null>(null);

  useEffect(() => {
    getUsersApi()
      .then(setUsers)
      .catch(() => addToast("Не удалось загрузить список пользователей", "error"))
      .finally(() => setLoading(false));
  }, [addToast]);

  const handleRoleChange = async (user: AdminUser, newRole: UserRole) => {
    if (newRole === user.role) return;
    setChangingId(user.id);
    try {
      const updated = await updateUserRoleApi(user.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      addToast(`Роль «${user.name}» изменена на «${ROLE_LABELS[newRole]}»`, "success");
    } catch {
      addToast(`Не удалось изменить роль пользователя «${user.name}»`, "error");
    } finally {
      setChangingId(null);
    }
  };

  const handleToggleBlock = async (user: AdminUser) => {
    setChangingId(user.id);
    const newBlocked = !user.is_blocked;
    try {
      const updated = await toggleUserBlockApi(user.id, newBlocked);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      addToast(
        newBlocked ? `«${user.name}» заблокирован` : `«${user.name}» разблокирован`,
        "success"
      );
    } catch {
      addToast(
        newBlocked
          ? `Не удалось заблокировать «${user.name}»`
          : `Не удалось разблокировать «${user.name}»`,
        "error"
      );
    } finally {
      setChangingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Пользователи</h1>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Имя</th>
                <th className="hidden px-4 py-3 md:table-cell">Email</th>
                <th className="hidden px-4 py-3 lg:table-cell">Телефон</th>
                <th className="hidden px-4 py-3 lg:table-cell">Зарегистрирован</th>
                <th className="px-4 py-3">Роль</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const isSelf = user.id === currentUser?.id;
                const isChanging = changingId === user.id;

                return (
                  <tr
                    key={user.id}
                    className={`transition hover:bg-slate-50 ${user.is_blocked ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {user.name}
                      {isSelf && (
                        <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                          вы
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{user.email}</td>
                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                      {user.phone ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                      {formatDate(user.created_at)}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="inline-block rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400">
                          {ROLE_LABELS[user.role]}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={isChanging || user.is_blocked}
                          onChange={(e) => void handleRoleChange(user, e.target.value as UserRole)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none ring-red-600 transition focus:ring disabled:opacity-50"
                        >
                          {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {!isSelf && (
                        <button
                          disabled={isChanging}
                          onClick={() => void handleToggleBlock(user)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                            user.is_blocked
                              ? "border-green-300 text-green-700 hover:bg-green-50"
                              : "border-red-200 text-red-600 hover:bg-red-50"
                          }`}
                        >
                          {isChanging ? "..." : user.is_blocked ? "Разблокировать" : "Заблокировать"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </main>
  );
}
