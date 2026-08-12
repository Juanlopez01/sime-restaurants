import type { CategoryWithProducts, Restaurant, Table } from "@/types";

export const DEMO_RESTAURANT: Restaurant = {
  id: "demo-la-ribera",
  slug: "la-ribera",
  name: "Parrilla La Ribera Caminito",
  address: "Caminito, La Boca, Buenos Aires",
  phone: null,
  logo_url: null,
  billing_config: {},
  mp_access_token: null,
  settings: { currency: "ARS", timezone: "America/Argentina/Buenos_Aires" },
  is_active: true,
  created_at: "",
  updated_at: "",
};

let catId = 0;
let prodId = 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const cat = (_name: string) => `cat-${++catId}`;
const prod = () => `prod-${++prodId}`;

const BASE = {
  restaurant_id: DEMO_RESTAURANT.id,
  is_active: true,
  created_at: "",
  updated_at: "",
};

export const DEMO_MENU: CategoryWithProducts[] = [
  {
    id: cat("Entradas"), name: "Entradas", display_order: 1, ...BASE,
    products: [
      { id: prod(), category_id: "cat-1", name: "Provoleta", description: "Provolone a la parrilla con orégano y aceite de oliva", price: 8500, image_url: null, is_available: true, display_order: 1, ...BASE },
      { id: prod(), category_id: "cat-1", name: "Empanadas (x3)", description: "Carne cortada a cuchillo, jamón y queso o verdura", price: 6500, image_url: null, is_available: true, display_order: 2, ...BASE },
      { id: prod(), category_id: "cat-1", name: "Tabla de Fiambres", description: "Jamón crudo, bondiola, quesos, aceitunas y grisines", price: 12000, image_url: null, is_available: true, display_order: 3, ...BASE },
      { id: prod(), category_id: "cat-1", name: "Chorizo a la Pomarola", description: "Chorizo criollo con salsa de tomate casera", price: 7500, image_url: null, is_available: true, display_order: 4, ...BASE },
    ],
  },
  {
    id: cat("Parrilla"), name: "Parrilla", display_order: 2, ...BASE,
    products: [
      { id: prod(), category_id: "cat-2", name: "Asado de Tira", description: "Corte clásico a la parrilla, cocción lenta", price: 18500, image_url: null, is_available: true, display_order: 1, ...BASE },
      { id: prod(), category_id: "cat-2", name: "Bife de Chorizo", description: "400g, punto a elección. Acompañado con papas", price: 22000, image_url: null, is_available: true, display_order: 2, ...BASE },
      { id: prod(), category_id: "cat-2", name: "Ojo de Bife", description: "350g con chimichurri casero", price: 24000, image_url: null, is_available: true, display_order: 3, ...BASE },
      { id: prod(), category_id: "cat-2", name: "Entraña", description: "Jugosa, con papas provenzal", price: 19500, image_url: null, is_available: true, display_order: 4, ...BASE },
      { id: prod(), category_id: "cat-2", name: "Vacío", description: "Cocción lenta, crocante por fuera", price: 17500, image_url: null, is_available: true, display_order: 5, ...BASE },
      { id: prod(), category_id: "cat-2", name: "Mollejas", description: "Crocantes a la parrilla con limón", price: 14500, image_url: null, is_available: true, display_order: 6, ...BASE },
      { id: prod(), category_id: "cat-2", name: "Parrillada para 2", description: "Asado, vacío, chorizo, morcilla, mollejas y chinchu", price: 38000, image_url: null, is_available: true, display_order: 7, ...BASE },
    ],
  },
  {
    id: cat("Pastas"), name: "Pastas", display_order: 3, ...BASE,
    products: [
      { id: prod(), category_id: "cat-3", name: "Sorrentinos de Jamón y Queso", description: "Con salsa fileto o crema", price: 13500, image_url: null, is_available: true, display_order: 1, ...BASE },
      { id: prod(), category_id: "cat-3", name: "Ñoquis de Papa", description: "Con tuco de carne o salsa cuatro quesos", price: 11000, image_url: null, is_available: true, display_order: 2, ...BASE },
      { id: prod(), category_id: "cat-3", name: "Tallarines al Huevo", description: "Con bolognesa casera", price: 12000, image_url: null, is_available: false, display_order: 3, ...BASE },
    ],
  },
  {
    id: cat("Ensaladas"), name: "Ensaladas", display_order: 4, ...BASE,
    products: [
      { id: prod(), category_id: "cat-4", name: "Mixta", description: "Lechuga, tomate, cebolla y zanahoria", price: 5500, image_url: null, is_available: true, display_order: 1, ...BASE },
      { id: prod(), category_id: "cat-4", name: "César", description: "Lechuga, croutones, parmesano, aderezo césar", price: 8500, image_url: null, is_available: true, display_order: 2, ...BASE },
    ],
  },
  {
    id: cat("Postres"), name: "Postres", display_order: 5, ...BASE,
    products: [
      { id: prod(), category_id: "cat-5", name: "Flan Casero", description: "Con dulce de leche y crema", price: 6500, image_url: null, is_available: true, display_order: 1, ...BASE },
      { id: prod(), category_id: "cat-5", name: "Panqueques con Dulce de Leche", description: "Dos panqueques con DDL y crema", price: 7000, image_url: null, is_available: true, display_order: 2, ...BASE },
      { id: prod(), category_id: "cat-5", name: "Helado Artesanal", description: "Tres bochas a elección", price: 5500, image_url: null, is_available: true, display_order: 3, ...BASE },
    ],
  },
  {
    id: cat("Bebidas"), name: "Bebidas", display_order: 6, ...BASE,
    products: [
      { id: prod(), category_id: "cat-6", name: "Agua Mineral", description: "500ml con o sin gas", price: 3000, image_url: null, is_available: true, display_order: 1, ...BASE },
      { id: prod(), category_id: "cat-6", name: "Gaseosa", description: "Línea Coca-Cola, 500ml", price: 3500, image_url: null, is_available: true, display_order: 2, ...BASE },
      { id: prod(), category_id: "cat-6", name: "Cerveza Artesanal", description: "Pinta, rubia o roja", price: 5500, image_url: null, is_available: true, display_order: 3, ...BASE },
      { id: prod(), category_id: "cat-6", name: "Vino Malbec", description: "Botella 750ml, Mendoza", price: 14000, image_url: null, is_available: true, display_order: 4, ...BASE },
      { id: prod(), category_id: "cat-6", name: "Fernet con Coca", description: "Medida", price: 6000, image_url: null, is_available: true, display_order: 5, ...BASE },
      { id: prod(), category_id: "cat-6", name: "Café", description: "Espresso o cortado", price: 3000, image_url: null, is_available: true, display_order: 6, ...BASE },
    ],
  },
];

const TB = { restaurant_id: DEMO_RESTAURANT.id, assigned_waiter_id: null as string | null, is_active: true, created_at: "", updated_at: "" };

export const DEMO_TABLES: Table[] = [
  { id: "t1", table_number: "1", x: 100, y: 100, width: 80, height: 80, shape: "square", capacity: 4, ...TB, assigned_waiter_id: "u2" },
  { id: "t2", table_number: "2", x: 250, y: 100, width: 80, height: 80, shape: "square", capacity: 4, ...TB, assigned_waiter_id: "u2" },
  { id: "t3", table_number: "3", x: 400, y: 100, width: 80, height: 80, shape: "square", capacity: 4, ...TB, assigned_waiter_id: "u2" },
  { id: "t4", table_number: "4", x: 100, y: 300, width: 100, height: 100, shape: "round", capacity: 6, ...TB },
  { id: "t5", table_number: "5", x: 300, y: 300, width: 100, height: 100, shape: "round", capacity: 6, ...TB },
  { id: "t6", table_number: "6", x: 500, y: 300, width: 120, height: 60, shape: "rect", capacity: 8, ...TB },
  { id: "t7", table_number: "7", x: 100, y: 500, width: 80, height: 80, shape: "square", capacity: 2, ...TB },
  { id: "t8", table_number: "8", x: 250, y: 500, width: 80, height: 80, shape: "square", capacity: 2, ...TB },
  { id: "t9", table_number: "9", x: 400, y: 500, width: 80, height: 80, shape: "square", capacity: 4, ...TB },
  { id: "t10", table_number: "10", x: 600, y: 500, width: 160, height: 60, shape: "rect", capacity: 10, ...TB },
];

export const DEMO_USERS = [
  { id: "u1", restaurant_id: DEMO_RESTAURANT.id, email: "admin@laribera.com", pin: "0001", name: "Admin La Ribera", role: "owner" as const, is_active: true, created_at: "", updated_at: "" },
  { id: "u2", restaurant_id: DEMO_RESTAURANT.id, email: null, pin: "1234", name: "Carlos (Mozo)", role: "waiter" as const, is_active: true, created_at: "", updated_at: "" },
  { id: "u3", restaurant_id: DEMO_RESTAURANT.id, email: null, pin: "5678", name: "María (Cajera)", role: "cashier" as const, is_active: true, created_at: "", updated_at: "" },
  { id: "u4", restaurant_id: DEMO_RESTAURANT.id, email: null, pin: "9999", name: "Cocina", role: "kitchen" as const, is_active: true, created_at: "", updated_at: "" },
];
