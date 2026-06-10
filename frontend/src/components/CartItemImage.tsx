import { API_BASE_URL } from "../api/client";
import { getSauceFromModifiers, getToppingsFromModifiers, isCustomPizza } from "../utils/pizzaHelpers";
import PizzaPreview from "./PizzaPreview";

type CartItemImageProps = {
  imageUrl?: string | null;
  name: string;
  modifiers?: string[];
  size?: number;
};

export default function CartItemImage({ imageUrl, name, modifiers, size = 56 }: CartItemImageProps) {
  if (isCustomPizza(modifiers)) {
    return (
      <PizzaPreview
        sauceName={getSauceFromModifiers(modifiers!)}
        toppingNames={getToppingsFromModifiers(modifiers!)}
        size={size}
      />
    );
  }

  if (imageUrl) {
    return (
      <img
        src={`${API_BASE_URL}${imageUrl}`}
        alt={name}
        className="h-full w-full object-contain p-1"
      />
    );
  }

  return <span className="flex h-full w-full items-center justify-center text-2xl">🍕</span>;
}
