import { Link, NavLink } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";

export default function Navbar() {
  const totalItems = useCartStore((state) => state.totalItems);
  const { isAuthenticated, user, logout } = useAuthStore();

  const navClassName = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? "text-red-600" : "text-slate-700 hover:text-red-600"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white">
            52
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-red-500">pizza</p>
            <p className="text-lg font-bold text-slate-900">Pizza52</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-6 mr-2">
            <NavLink to="/" className={navClassName}>
              Меню
            </NavLink>
            <NavLink to="/constructor" className={navClassName}>
              Конструктор
            </NavLink>
          </nav>
          {isAuthenticated && user && (
            <>
              <NavLink to="/my-pizzas" className={navClassName}>
                Мои пиццы
              </NavLink>
              <NavLink to="/orders" className={navClassName}>
                Мои заказы
              </NavLink>
            </>
          )}
          {isAuthenticated && user?.role === "admin" && (
            <>
              <span className="h-5 w-px bg-slate-200" />
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-red-700 text-white"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Админ
              </NavLink>
            </>
          )}
          <NavLink
            to="/cart"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            Корзина ({totalItems})
          </NavLink>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <NavLink
                to="/profile"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                {user.name}
              </NavLink>
              <button
                onClick={logout}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Выйти
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Войти
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
