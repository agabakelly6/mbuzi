// src/data/menu.ts
//
// Shared menu data model. The homepage's Signature Dishes preview reads
// FEATURED_MENU_ITEMS; the full /menu page reads the per-category exports
// below and CHEF_PICK. One array, several derived views — adding a dish
// means adding one object here, not touching every consumer.
//
// Sourced from the real YPA Mbuzi Choma printed menu (photographed
// in-restaurant). Every name, description, and price below is transcribed
// from that menu — nothing here is invented. Image paths point at
// filenames reserved for real dish photography; the source photos were
// glare-heavy, angled shots of a laminated menu, not usable food
// photography, so no images were extracted or cropped from them.
// Replace with real food photography later.

export type MenuCategory =
  | "breakfast"
  | "main-course"
  | "burgers"
  | "sandwiches"
  | "pizza"
  | "lusaniya"
  | "smoothies"
  | "drinks";

/** A secondary price for a portion size or add-on (e.g. "4 People", "With Accompaniments"). */
export interface MenuItemVariation {
  label: string;
  price: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  /** Base/starting price. When `variations` is set, this is the lowest tier. */
  price: string;
  /** Additional priced options — portion sizes, accompaniments, etc. */
  variations?: MenuItemVariation[];
  image: string;
  category: MenuCategory;
  /** Groups items within a category section (used by Drinks: Milkshakes, Tea & Hot Drinks, Juices, Soft Drinks, Wine). */
  subcategory?: string;
  featured?: boolean;
  chefPick?: boolean;
}

export const MENU_ITEMS: MenuItem[] = [
  // Breakfast
  {
    id: "goat-katogo",
    name: "Goat Katogo",
    description:
      "A rich vegetable stew served with your choice of rice, matooke, potatoes, and chapati.",
    price: "UGX 10,000",
    image: "/images/food/goat-katogo.jpg",
    category: "breakfast",
  },
  {
    id: "choma-wrap",
    name: "Choma Wrap",
    description: "Chapati rolled with Mbuzi sauces, goat strips, and Spanish egg.",
    price: "UGX 10,000",
    image: "/images/food/choma-wrap.jpg",
    category: "breakfast",
  },
  {
    id: "tropical-choma-pancakes",
    name: "Tropical Choma Pancakes",
    description: "Three fluffy pancakes topped with fresh seasonal fruits and syrup.",
    price: "UGX 20,000",
    image: "/images/food/tropical-choma-pancakes.jpg",
    category: "breakfast",
  },
  {
    id: "caprines-breakfast",
    name: "Caprines",
    description:
      "Eggs, Lyonnaise potatoes, sausage, fruit, goat, grilled tomato, toasted bread, butter, and jam.",
    price: "UGX 30,000",
    image: "/images/food/caprines-breakfast.jpg",
    category: "breakfast",
  },

  // Main Course
  {
    id: "mbuzi-choma-special",
    name: "Mbuzi Choma Special",
    description: "Tender goat grilled the chef's way.",
    price: "UGX 40,000",
    variations: [
      { label: "Without Accompaniments", price: "UGX 40,000" },
      { label: "With Accompaniments", price: "UGX 45,000" },
    ],
    image: "/images/food/mbuzi-choma-special.jpg",
    category: "main-course",
    featured: true,
    chefPick: true,
  },
  {
    id: "pan-fried-goat",
    name: "Pan-Fried Goat",
    description: "Tender goat slow-cooked with vegetables, served with fresh salad.",
    price: "UGX 40,000",
    variations: [
      { label: "Without Accompaniments", price: "UGX 40,000" },
      { label: "With Accompaniments", price: "UGX 45,000" },
    ],
    image: "/images/food/pan-fried-goat.jpg",
    category: "main-course",
  },
  {
    id: "pan-fried-liver",
    name: "Pan-Fried Liver",
    description: "Rich and tender goat liver cooked to perfection.",
    price: "UGX 30,000",
    image: "/images/food/pan-fried-liver.jpg",
    category: "main-course",
  },
  {
    id: "goat-stew",
    name: "Goat Stew",
    description: "Tender goat simmered with fresh vegetables for a rich, hearty flavour.",
    price: "UGX 25,000",
    image: "/images/food/goat-stew.jpg",
    category: "main-course",
  },
  {
    id: "flaming-skewers",
    name: "Flaming Skewers",
    description: "Tender, marinated goat meat grilled on skewers until smoky, juicy, and flavorful.",
    price: "UGX 38,000",
    image: "/images/food/flaming-skewers.jpg",
    category: "main-course",
  },

  // Burgers
  {
    id: "mbuzi-choma-burger",
    name: "Mbuzi Choma Burger",
    description: "Goat patty, fresh tomato, onions, lettuce, onion rings.",
    price: "UGX 40,000",
    image: "/images/food/mbuzi-choma-burger.jpg",
    category: "burgers",
  },
  {
    id: "herd-master-burger",
    name: "The Herd Master Burger",
    description: "Goat patty, grilled tomato, avocado, fried egg, and cheddar cheese.",
    price: "UGX 35,000",
    image: "/images/food/herd-master-burger.jpg",
    category: "burgers",
    featured: true,
  },
  {
    id: "smoky-mbuzi-burger",
    name: "Smoky Mbuzi Burger",
    description: "Goat patty with house-smoked BBQ sauce.",
    price: "UGX 35,000",
    image: "/images/food/smoky-mbuzi-burger.jpg",
    category: "burgers",
  },

  // Sandwiches
  {
    id: "goat-mayo-sandwich",
    name: "Goat Mayo Sandwich",
    description: "Goat strips, tomatoes, and lettuce.",
    price: "UGX 20,000",
    image: "/images/food/goat-mayo-sandwich.jpg",
    category: "sandwiches",
  },
  {
    id: "club-sandwich",
    name: "Club Sandwich",
    description: "Goat strips, cheddar cheese, avocado, fried egg, and tomato.",
    price: "UGX 33,000",
    image: "/images/food/club-sandwich.jpg",
    category: "sandwiches",
  },
  {
    id: "heavens-goat-sandwich",
    name: "Heaven's Goat Sandwich",
    description: "Goat strips with tomato and cocktail sauce.",
    price: "UGX 20,000",
    image: "/images/food/heavens-goat-sandwich.jpg",
    category: "sandwiches",
  },

  // Pizza
  {
    id: "mbuzi-choma-mixed-pizza",
    name: "Mbuzi Choma Mixed Pizza",
    description:
      "Pomodoro sauce, mozzarella cheese, goat strips, sweet corn, black olives, baked onions, and fresh tomato.",
    price: "UGX 40,000",
    image: "/images/food/mbuzi-choma-mixed-pizza.jpg",
    category: "pizza",
    featured: true,
  },
  {
    id: "kiddos-pizza",
    name: "Kiddos Pizza",
    description: "Goat strips, pineapple, mozzarella cheese.",
    price: "UGX 40,000",
    image: "/images/food/kiddos-pizza.jpg",
    category: "pizza",
  },
  {
    id: "goat-bbq-pizza",
    name: "Goat BBQ Pizza",
    description: "Pomodoro mixed with Mbuzi BBQ sauce, mozzarella cheese, goat strips, and baked onions.",
    price: "UGX 40,000",
    image: "/images/food/goat-bbq-pizza.jpg",
    category: "pizza",
  },

  // Lusaniya (sharing platters)
  {
    id: "pilau-lusaniya",
    name: "Pilau Lusaniya",
    description: "A sharing platter of spiced pilau rice served with grilled goat cuts — built for the table.",
    price: "UGX 75,000",
    variations: [
      { label: "2 People", price: "UGX 75,000" },
      { label: "4 People", price: "UGX 150,000" },
    ],
    image: "/images/food/pilau-lusaniya.jpg",
    category: "lusaniya",
  },
  {
    id: "nyama-fest",
    name: "Nyama Fest",
    description:
      "A generous sharing platter of mixed grilled goat cuts with garden vegetables — built for the table.",
    price: "UGX 85,000",
    variations: [
      { label: "2 People", price: "UGX 85,000" },
      { label: "4 People", price: "UGX 165,000" },
    ],
    image: "/images/food/nyama-fest.jpg",
    category: "lusaniya",
    featured: true,
  },

  // Smoothies
  {
    id: "banana-smoothie",
    name: "Banana Smoothie",
    description: "Banana & vanilla yogurt.",
    price: "UGX 15,000",
    image: "/images/food/banana-smoothie.jpg",
    category: "smoothies",
  },
  {
    id: "avocado-smoothie",
    name: "Avocado Smoothie",
    description: "Avocado & vanilla yogurt.",
    price: "UGX 15,000",
    image: "/images/food/avocado-smoothie.jpg",
    category: "smoothies",
  },
  {
    id: "obeds-touch-smoothie",
    name: "Obed's Touch Smoothie",
    description: "Banana, beetroot, mango & lemon zest.",
    price: "UGX 15,000",
    image: "/images/food/obeds-touch-smoothie.jpg",
    category: "smoothies",
  },
  {
    id: "mango-smoothie",
    name: "Mango Smoothie",
    description: "Mango & vanilla yogurt.",
    price: "UGX 15,000",
    image: "/images/food/mango-smoothie.jpg",
    category: "smoothies",
  },

  // Drinks — Milkshakes
  {
    id: "vanilla-shake",
    name: "Vanilla Shake",
    description: "Classic vanilla milkshake, thick and cold.",
    price: "UGX 17,000",
    image: "/images/food/vanilla-shake.jpg",
    category: "drinks",
    subcategory: "Milkshakes",
  },
  {
    id: "oreo-shake",
    name: "Oreo Shake",
    description: "Milkshake blended with crushed Oreo cookies.",
    price: "UGX 17,000",
    image: "/images/food/oreo-shake.jpg",
    category: "drinks",
    subcategory: "Milkshakes",
  },
  {
    id: "strawberry-shake",
    name: "Strawberry Shake",
    description: "Milkshake blended with fresh strawberry.",
    price: "UGX 17,000",
    image: "/images/food/strawberry-shake.jpg",
    category: "drinks",
    subcategory: "Milkshakes",
  },
  {
    id: "caramel-shake",
    name: "Caramel Shake",
    description: "Milkshake swirled with caramel.",
    price: "UGX 17,000",
    image: "/images/food/caramel-shake.jpg",
    category: "drinks",
    subcategory: "Milkshakes",
  },
  {
    id: "chocolate-shake",
    name: "Chocolate Shake",
    description: "Rich chocolate milkshake.",
    price: "UGX 17,000",
    image: "/images/food/chocolate-shake.jpg",
    category: "drinks",
    subcategory: "Milkshakes",
  },

  // Drinks — Tea & Hot Drinks
  {
    id: "goats-milk-tea",
    name: "Goat's Milk Tea",
    description: "Tea brewed with fresh goat's milk.",
    price: "UGX 20,000",
    image: "/images/food/goats-milk-tea.jpg",
    category: "drinks",
    subcategory: "Tea & Hot Drinks",
  },
  {
    id: "black-tea",
    name: "Black Tea",
    description: "Classic black tea.",
    price: "UGX 8,000",
    image: "/images/food/black-tea.jpg",
    category: "drinks",
    subcategory: "Tea & Hot Drinks",
  },
  {
    id: "african-tea",
    name: "African Tea",
    description: "Spiced East African tea.",
    price: "UGX 10,000",
    image: "/images/food/african-tea.jpg",
    category: "drinks",
    subcategory: "Tea & Hot Drinks",
  },
  {
    id: "black-coffee",
    name: "Black Coffee",
    description: "Freshly brewed black coffee.",
    price: "UGX 10,000",
    image: "/images/food/black-coffee.jpg",
    category: "drinks",
    subcategory: "Tea & Hot Drinks",
  },
  {
    id: "hot-chocolate",
    name: "Hot Chocolate",
    description: "Rich hot chocolate.",
    price: "UGX 15,000",
    image: "/images/food/hot-chocolate.jpg",
    category: "drinks",
    subcategory: "Tea & Hot Drinks",
  },
  {
    id: "dawa-tea",
    name: "Dawa Tea",
    description: "Honey, lemon, and ginger infused tea.",
    price: "UGX 15,000",
    image: "/images/food/dawa-tea.jpg",
    category: "drinks",
    subcategory: "Tea & Hot Drinks",
  },
  {
    id: "african-coffee",
    name: "African Coffee",
    description: "Locally roasted African coffee.",
    price: "UGX 12,000",
    image: "/images/food/african-coffee.jpg",
    category: "drinks",
    subcategory: "Tea & Hot Drinks",
  },
  {
    id: "green-tea",
    name: "Green Tea",
    description: "Light, refreshing green tea.",
    price: "UGX 15,000",
    image: "/images/food/green-tea.jpg",
    category: "drinks",
    subcategory: "Tea & Hot Drinks",
  },

  // Drinks — Juices
  {
    id: "beetroot-juice",
    name: "Beetroot Juice",
    description: "Fresh beetroot juice.",
    price: "UGX 10,000",
    image: "/images/food/beetroot-juice.jpg",
    category: "drinks",
    subcategory: "Juices",
  },
  {
    id: "passion-juice",
    name: "Passion Juice",
    description: "Fresh passion fruit juice.",
    price: "UGX 8,000",
    image: "/images/food/passion-juice.jpg",
    category: "drinks",
    subcategory: "Juices",
  },
  {
    id: "watermelon-juice",
    name: "Watermelon Juice",
    description: "Fresh watermelon juice.",
    price: "UGX 8,000",
    image: "/images/food/watermelon-juice.jpg",
    category: "drinks",
    subcategory: "Juices",
  },
  {
    id: "pineapple-juice",
    name: "Pineapple Juice",
    description: "Fresh pineapple juice.",
    price: "UGX 8,000",
    image: "/images/food/pineapple-juice.jpg",
    category: "drinks",
    subcategory: "Juices",
  },
  {
    id: "mango-juice",
    name: "Mango Juice",
    description: "Fresh mango juice.",
    price: "UGX 10,000",
    image: "/images/food/mango-juice.jpg",
    category: "drinks",
    subcategory: "Juices",
  },
  {
    id: "cocktail-juice",
    name: "Cocktail Juice",
    description: "A fresh blend of mixed fruit juices.",
    price: "UGX 15,000",
    image: "/images/food/cocktail-juice.jpg",
    category: "drinks",
    subcategory: "Juices",
  },

  // Drinks — Soft Drinks
  {
    id: "soda",
    name: "Soda",
    description: "Assorted soft drinks.",
    price: "UGX 3,000",
    image: "/images/food/soda.jpg",
    category: "drinks",
    subcategory: "Soft Drinks",
  },
  {
    id: "bottled-water",
    name: "Water",
    description: "Still bottled water.",
    price: "UGX 3,000",
    image: "/images/food/bottled-water.jpg",
    category: "drinks",
    subcategory: "Soft Drinks",
  },
  {
    id: "yoghurt-drink",
    name: "Yoghurt",
    description: "Chilled drinking yoghurt.",
    price: "UGX 5,000",
    image: "/images/food/yoghurt-drink.jpg",
    category: "drinks",
    subcategory: "Soft Drinks",
  },

  // Drinks — Wine
  {
    id: "glass-of-wine",
    name: "Glass of Wine",
    description: "A glass of house wine.",
    price: "UGX 5,000",
    image: "/images/food/glass-of-wine.jpg",
    category: "drinks",
    subcategory: "Wine",
  },
];

export const FEATURED_MENU_ITEMS = MENU_ITEMS.filter((item) => item.featured);
export const BREAKFAST_ITEMS = MENU_ITEMS.filter((item) => item.category === "breakfast");
export const MAIN_COURSE_ITEMS = MENU_ITEMS.filter((item) => item.category === "main-course");
export const BURGER_ITEMS = MENU_ITEMS.filter((item) => item.category === "burgers");
export const SANDWICH_ITEMS = MENU_ITEMS.filter((item) => item.category === "sandwiches");
export const PIZZA_ITEMS = MENU_ITEMS.filter((item) => item.category === "pizza");
export const LUSANIYA_ITEMS = MENU_ITEMS.filter((item) => item.category === "lusaniya");
export const SMOOTHIE_ITEMS = MENU_ITEMS.filter((item) => item.category === "smoothies");
export const DRINK_ITEMS = MENU_ITEMS.filter((item) => item.category === "drinks");
export const CHEF_PICK = MENU_ITEMS.find((item) => item.chefPick);
