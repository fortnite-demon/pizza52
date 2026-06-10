const SAUCE_FILES: Record<string, string> = {
  томатный: "/ingredients/sauce_tomato.png",
  сливочный: "/ingredients/sauce_cream.png",
  барбекю: "/ingredients/sauce_bbq.png",
  острый: "/ingredients/sauce_spicy.png",
};

const TOPPING_FILES: Record<string, string> = {
  моцарелла: "/ingredients/mozarella.png",
  чеддер: "/ingredients/cheddar.png",
  пепперони: "/ingredients/pepperoni.png",
  ветчина: "/ingredients/ham.png",
  бекон: "/ingredients/bacon.png",
  томаты: "/ingredients/tomato.png",
  перец: "/ingredients/pepper.png",
  курица: "/ingredients/chicken.png",
  маслины: "/ingredients/olives.png",
  ананас: "/ingredients/pineapple.png",
  грибы: "/ingredients/mushrooms.png",
  лук: "/ingredients/onion.png",
  пармезан: "/ingredients/parmezan.png",
};

const TOPPING_SCALE: Record<string, number> = {
  моцарелла: 0.81,
  чеддер: 0.77,
  пепперони: 0.77,
  ветчина: 0.77,
  бекон: 0.8,
  томаты: 0.8,
  перец: 0.7,
  курица: 0.7,
  маслины: 0.7,
  ананас: 0.7,
  грибы: 0.76,
  лук: 0.7,
  пармезан: 0.7,
};

type PizzaPreviewProps = {
  sauceName: string | null;
  toppingNames: string[];
  size?: number;
};

export default function PizzaPreview({ sauceName, toppingNames, size = 180 }: PizzaPreviewProps) {
  const sauceFile = sauceName ? (SAUCE_FILES[sauceName.toLowerCase()] ?? null) : null;
  const toppings = toppingNames
    .map((name) => {
      const key = name.toLowerCase();
      const file = TOPPING_FILES[key];
      return file ? { file, scale: TOPPING_SCALE[key] ?? 1 } : null;
    })
    .filter(Boolean) as { file: string; scale: number }[];

  return (
    <div
      className="relative overflow-hidden rounded-full transition-all duration-300"
      style={{ width: size, height: size }}
    >
      <img
        src="/ingredients/dough.png"
        alt="dough"
        className="absolute left-0 top-0 h-full w-full object-cover"
      />
      {sauceFile && (
        <img
          src={sauceFile}
          alt="sauce"
          className="absolute left-0 top-0 h-full w-full object-cover"
        />
      )}
      {toppings.map(({ file, scale }) => (
        <img
          key={file}
          src={file}
          alt=""
          className="absolute left-0 top-0 h-full w-full object-cover"
          style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}
        />
      ))}
    </div>
  );
}
