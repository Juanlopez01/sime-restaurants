import { DEMO_RESTAURANT } from "./demo-data";
import { slugify } from "./utils";

interface DemoOwner {
  id: string;
  email: string;
  password: string;
  name: string;
  restaurantId: string;
}

interface DemoRestaurantRecord {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  phone: string | null;
  ownerId: string;
}

let nextId = 100;
function genId() {
  return `demo-${++nextId}`;
}

const owners: DemoOwner[] = [
  {
    id: "owner-1",
    email: "admin@laribera.com",
    password: "12345678",
    name: "Admin La Ribera",
    restaurantId: DEMO_RESTAURANT.id,
  },
];

const restaurants: DemoRestaurantRecord[] = [
  {
    id: DEMO_RESTAURANT.id,
    slug: DEMO_RESTAURANT.slug,
    name: DEMO_RESTAURANT.name,
    address: DEMO_RESTAURANT.address,
    phone: DEMO_RESTAURANT.phone,
    ownerId: "owner-1",
  },
];

export function demoRegister(data: {
  email: string;
  password: string;
  name: string;
  restaurantName: string;
  phone?: string;
}): { owner: DemoOwner; restaurant: DemoRestaurantRecord } | { error: string } {
  if (owners.find((o) => o.email === data.email)) {
    return { error: "Ya existe una cuenta con ese email" };
  }

  const ownerId = genId();
  const restaurantId = genId();
  let slug = slugify(data.restaurantName);

  if (restaurants.find((r) => r.slug === slug)) {
    slug = slug + "-" + Date.now().toString(36).slice(-4);
  }

  const owner: DemoOwner = {
    id: ownerId,
    email: data.email,
    password: data.password,
    name: data.name,
    restaurantId,
  };

  const restaurant: DemoRestaurantRecord = {
    id: restaurantId,
    slug,
    name: data.restaurantName,
    address: null,
    phone: data.phone || null,
    ownerId,
  };

  owners.push(owner);
  restaurants.push(restaurant);

  return { owner, restaurant };
}

export function demoLogin(
  email: string,
  password: string
): { owner: DemoOwner; restaurant: DemoRestaurantRecord } | { error: string } {
  const owner = owners.find((o) => o.email === email);
  if (!owner) {
    return { error: "Email o contraseña incorrectos" };
  }
  if (owner.password !== password) {
    return { error: "Email o contraseña incorrectos" };
  }

  const restaurant = restaurants.find((r) => r.id === owner.restaurantId);
  if (!restaurant) {
    return { error: "Restaurante no encontrado" };
  }

  return { owner, restaurant };
}

export function demoGetOwnerById(
  id: string
): { owner: DemoOwner; restaurant: DemoRestaurantRecord } | null {
  const owner = owners.find((o) => o.id === id);
  if (!owner) return null;

  const restaurant = restaurants.find((r) => r.id === owner.restaurantId);
  if (!restaurant) return null;

  return { owner, restaurant };
}

export function demoGetRestaurantBySlug(slug: string): DemoRestaurantRecord | null {
  return restaurants.find((r) => r.slug === slug) || null;
}
