export type UserRole = "customer" | "admin";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "cooking"
  | "delivering"
  | "delivered"
  | "cancelled";

export type MenuCategory = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
};

export type Dish = {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  is_constructable: boolean;
};

export type DishIngredient = {
  ingredient_id: number;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  is_required: boolean;
};

export type DishDetails = Dish & {
  ingredients: DishIngredient[];
  modifiers: DishModifier[];
  category_name: string | null;
};

export type DishModifier = {
  id: number;
  name: string;
  price: number;
  type: "size" | "dough" | "sauce" | "topping" | string;
};

export type CartItemInput = {
  dishId: number;
  name: string;
  price: number;
  quantity: number;
  modifiers?: string[];
};
