-- ============================================================
-- SEED DATA: Parrilla La Ribera Caminito
-- Ejecutar después de 001_initial_schema.sql
-- ============================================================

-- Categorías
insert into categories (restaurant_id, name, display_order) values
  ((select id from restaurants where slug = 'la-ribera'), 'Entradas', 1),
  ((select id from restaurants where slug = 'la-ribera'), 'Parrilla', 2),
  ((select id from restaurants where slug = 'la-ribera'), 'Pastas', 3),
  ((select id from restaurants where slug = 'la-ribera'), 'Ensaladas', 4),
  ((select id from restaurants where slug = 'la-ribera'), 'Postres', 5),
  ((select id from restaurants where slug = 'la-ribera'), 'Bebidas', 6);

-- Entradas
insert into products (restaurant_id, category_id, name, description, price, display_order, is_available) values
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Entradas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Provoleta', 'Provolone a la parrilla con orégano y aceite de oliva', 8500, 1, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Entradas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Empanadas (x3)', 'Carne cortada a cuchillo, jamón y queso o verdura', 6500, 2, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Entradas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Tabla de Fiambres', 'Jamón crudo, bondiola, quesos, aceitunas y grisines', 12000, 3, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Entradas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Chorizo a la Pomarola', 'Chorizo criollo con salsa de tomate casera', 7500, 4, true);

-- Parrilla
insert into products (restaurant_id, category_id, name, description, price, display_order, is_available) values
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Parrilla' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Asado de Tira', 'Corte clásico a la parrilla, cocción lenta', 18500, 1, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Parrilla' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Bife de Chorizo', '400g, punto a elección. Acompañado con papas', 22000, 2, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Parrilla' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Ojo de Bife', '350g con chimichurri casero', 24000, 3, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Parrilla' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Entraña', 'Jugosa, con papas provenzal', 19500, 4, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Parrilla' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Vacío', 'Cocción lenta, crocante por fuera', 17500, 5, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Parrilla' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Mollejas', 'Crocantes a la parrilla con limón', 14500, 6, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Parrilla' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Parrillada para 2', 'Asado, vacío, chorizo, morcilla, mollejas y chinchu', 38000, 7, true);

-- Pastas
insert into products (restaurant_id, category_id, name, description, price, display_order, is_available) values
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Pastas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Sorrentinos de Jamón y Queso', 'Con salsa fileto o crema', 13500, 1, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Pastas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Ñoquis de Papa', 'Con tuco de carne o salsa cuatro quesos', 11000, 2, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Pastas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Tallarines al Huevo', 'Con bolognesa casera', 12000, 3, false);

-- Ensaladas
insert into products (restaurant_id, category_id, name, description, price, display_order, is_available) values
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Ensaladas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Mixta', 'Lechuga, tomate, cebolla y zanahoria', 5500, 1, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Ensaladas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'César', 'Lechuga, croutones, parmesano, aderezo césar', 8500, 2, true);

-- Postres
insert into products (restaurant_id, category_id, name, description, price, display_order, is_available) values
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Postres' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Flan Casero', 'Con dulce de leche y crema', 6500, 1, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Postres' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Panqueques con Dulce de Leche', 'Dos panqueques con DDL y crema', 7000, 2, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Postres' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Helado Artesanal', 'Tres bochas a elección', 5500, 3, true);

-- Bebidas
insert into products (restaurant_id, category_id, name, description, price, display_order, is_available) values
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Bebidas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Agua Mineral', '500ml con o sin gas', 3000, 1, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Bebidas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Gaseosa', 'Línea Coca-Cola, 500ml', 3500, 2, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Bebidas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Cerveza Artesanal', 'Pinta, rubia o roja', 5500, 3, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Bebidas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Vino Malbec', 'Botella 750ml, Mendoza', 14000, 4, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Bebidas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Fernet con Coca', 'Medida', 6000, 5, true),
  ((select id from restaurants where slug = 'la-ribera'),
   (select id from categories where name = 'Bebidas' and restaurant_id = (select id from restaurants where slug = 'la-ribera')),
   'Café', 'Espresso o cortado', 3000, 6, true);

-- Mesas de ejemplo
insert into tables (restaurant_id, table_number, x, y, width, height, shape, capacity) values
  ((select id from restaurants where slug = 'la-ribera'), '1', 100, 100, 80, 80, 'square', 4),
  ((select id from restaurants where slug = 'la-ribera'), '2', 250, 100, 80, 80, 'square', 4),
  ((select id from restaurants where slug = 'la-ribera'), '3', 400, 100, 80, 80, 'square', 4),
  ((select id from restaurants where slug = 'la-ribera'), '4', 100, 300, 100, 100, 'round', 6),
  ((select id from restaurants where slug = 'la-ribera'), '5', 300, 300, 100, 100, 'round', 6),
  ((select id from restaurants where slug = 'la-ribera'), '6', 500, 300, 120, 60, 'rect', 8),
  ((select id from restaurants where slug = 'la-ribera'), '7', 100, 500, 80, 80, 'square', 2),
  ((select id from restaurants where slug = 'la-ribera'), '8', 250, 500, 80, 80, 'square', 2),
  ((select id from restaurants where slug = 'la-ribera'), '9', 400, 500, 80, 80, 'square', 4),
  ((select id from restaurants where slug = 'la-ribera'), '10', 600, 500, 160, 60, 'rect', 10);

-- Mozo de ejemplo
insert into users (restaurant_id, pin, name, role) values
  ((select id from restaurants where slug = 'la-ribera'), '1234', 'Carlos (Mozo)', 'waiter'),
  ((select id from restaurants where slug = 'la-ribera'), '5678', 'María (Cajera)', 'cashier'),
  ((select id from restaurants where slug = 'la-ribera'), '9999', 'Cocina', 'kitchen');
