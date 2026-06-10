import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import CartItemImage from "../components/CartItemImage";
import { type AddressData, createOrderApi, deleteAddressApi, getAddressesApi } from "../api/orders";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";
import { useToastStore } from "../store/useToastStore";

const DELIVERY_FEE = 199;
const FREE_DELIVERY_THRESHOLD = 1000;

type PaymentMethod = "card" | "cash";

export default function CheckoutPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { items, totalPrice, clearCart } = useCartStore();

  const [savedAddresses, setSavedAddresses] = useState<AddressData[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");

  const [city, setCity] = useState("Нижний Новгород");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [apartment, setApartment] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [comment, setComment] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);

  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    getAddressesApi()
      .then((addresses) => {
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          const def = addresses.find((a) => a.is_default) ?? addresses[0];
          setSelectedAddressId(def.id);
        }
      })
      .catch(() => {});
  }, []);

  const handleDeleteAddress = async (id: number) => {
    setDeletingAddressId(id);
    try {
      await deleteAddressApi(id);
      const remaining = savedAddresses.filter((a) => a.id !== id);
      setSavedAddresses(remaining);
      if (selectedAddressId === id) {
        const next = remaining.find((a) => a.is_default) ?? remaining[0];
        setSelectedAddressId(next ? next.id : "new");
      }
    } catch {
      // silent — address stays in the list if deletion failed
    } finally {
      setDeletingAddressId(null);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login?redirect=/checkout" replace />;
  if (items.length === 0 && !submitted) return <Navigate to="/" replace />;

  const delivery = totalPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = totalPrice + delivery;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedAddressId === "new" && (!street.trim() || !house.trim())) {
      setError("Заполните улицу и дом.");
      return;
    }

    setIsSubmitting(true);
    const deliveryFee = totalPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    try {
      const payload =
        selectedAddressId === "new"
          ? {
              new_address: {
                city: city.trim(),
                street: street.trim(),
                house: house.trim(),
                apartment: apartment.trim() || undefined,
              },
              payment_method: paymentMethod,
              comment: comment.trim() || undefined,
              delivery_fee: deliveryFee,
            }
          : {
              address_id: selectedAddressId,
              payment_method: paymentMethod,
              comment: comment.trim() || undefined,
              delivery_fee: deliveryFee,
            };

      await createOrderApi(payload);
      await clearCart();
      setSubmitted(true);
      addToast("Заказ успешно оформлен!", "success");
      setTimeout(() => navigate("/orders"), 1500);
    } catch {
      setError("Не удалось оформить заказ. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Оформление заказа</h1>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Left: form */}
          <div className="flex-1 space-y-5">

            {/* Address section */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-900">Адрес доставки</h2>

              {savedAddresses.length > 0 && (
                <div className="mb-4 space-y-2">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                        selectedAddressId === addr.id ? "border-red-300" : "border-slate-200"
                      }`}
                    >
                      <label className="flex flex-1 cursor-pointer items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-0.5 accent-red-600"
                        />
                        <span className="text-sm text-slate-700">
                          {addr.city}, ул. {addr.street}, д. {addr.house}
                          {addr.apartment ? `, кв. ${addr.apartment}` : ""}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => void handleDeleteAddress(addr.id)}
                        disabled={deletingAddressId === addr.id}
                        className="flex-shrink-0 text-slate-300 transition hover:text-red-500 disabled:opacity-50"
                        aria-label="Удалить адрес"
                      >
                        {deletingAddressId === addr.id ? "…" : "✕"}
                      </button>
                    </div>
                  ))}
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-red-300">
                    <input
                      type="radio"
                      name="address"
                      value="new"
                      checked={selectedAddressId === "new"}
                      onChange={() => setSelectedAddressId("new")}
                      className="accent-red-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Новый адрес</span>
                  </label>
                </div>
              )}

              {selectedAddressId === "new" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Город</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-red-600 focus:ring"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Улица</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-red-600 focus:ring"
                      placeholder="Большая Покровская"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Дом</label>
                    <input
                      type="text"
                      value={house}
                      onChange={(e) => setHouse(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-red-600 focus:ring"
                      placeholder="5"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Квартира <span className="text-slate-400">(необязательно)</span>
                    </label>
                    <input
                      type="text"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-red-600 focus:ring"
                      placeholder="12"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Payment section */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-900">Способ оплаты</h2>
              <div className="grid grid-cols-2 gap-3">
                {(["card", "cash"] as PaymentMethod[]).map((method) => {
                  const isActive = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "border-red-600 bg-red-50 text-red-600"
                          : "border-slate-200 text-slate-700 hover:border-red-200"
                      }`}
                    >
                      <span className="text-2xl">{method === "card" ? "💳" : "💵"}</span>
                      {method === "card" ? "Картой онлайн" : "Наличными курьеру"}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Comment section */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-900">Комментарий</h2>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Например: домофон не работает"
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-red-600 focus:ring"
              />
            </section>
          </div>

          {/* Right: summary */}
          <div className="lg:w-80">
            <div className="sticky top-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-900">Ваш заказ</h2>

              <ul className="mb-3 space-y-2">
                {items.map((item, i) => (
                  <li key={`${item.dishId}-${i}`} className="flex items-start gap-2">
                    <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <CartItemImage
                        imageUrl={item.imageUrl}
                        name={item.name}
                        modifiers={item.modifiers}
                        size={36}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {item.name}
                        {item.quantity > 1 && (
                          <span className="ml-1 text-slate-400">× {item.quantity}</span>
                        )}
                      </p>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <p className="truncate text-xs text-slate-400">{item.modifiers.join(", ")}</p>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-sm font-semibold text-slate-900">
                      {item.price * item.quantity} ₽
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Товары</span>
                  <span>{totalPrice} ₽</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Доставка</span>
                  <span>
                    {delivery === 0 ? (
                      <span className="font-medium text-green-600">Бесплатно</span>
                    ) : (
                      `${delivery} ₽`
                    )}
                  </span>
                </div>
                {delivery > 0 && (
                  <p className="text-xs text-slate-400">
                    Бесплатно от {FREE_DELIVERY_THRESHOLD} ₽
                  </p>
                )}
              </div>

              <div className="my-4 flex justify-between text-base font-bold text-slate-900">
                <span>Итого</span>
                <span>{grandTotal} ₽</span>
              </div>

              {error && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Оформляем..." : "Подтвердить заказ"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
