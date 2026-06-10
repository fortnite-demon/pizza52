import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import Navbar from "./components/Navbar";
import ToastContainer from "./components/ToastContainer";
import AdminUsersPage from "./pages/AdminUsersPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ConstructorPage from "./pages/ConstructorPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MyPizzasPage from "./pages/MyPizzasPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import OrdersPage from "./pages/OrdersPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  const bootstrapAuth = useAuthStore((state) => state.bootstrapAuth);

  useEffect(() => {
    void bootstrapAuth();
  }, [bootstrapAuth]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/constructor" element={<ConstructorPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/my-pizzas" element={<MyPizzasPage />} />
        <Route
          path="/admin/users"
          element={<AdminRoute><AdminUsersPage /></AdminRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
