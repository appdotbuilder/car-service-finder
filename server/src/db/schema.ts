
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const vehicleTypeEnum = pgEnum('vehicle_type', ['4-seater', '7-seater', '16-seater', 'other']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'completed', 'cancelled']);

// Car services table
export const carServicesTable = pgTable('car_services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  description: text('description'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Vehicles table
export const vehiclesTable = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  service_id: integer('service_id').notNull(),
  type: vehicleTypeEnum('type').notNull(),
  capacity: integer('capacity').notNull(),
  description: text('description'),
  is_available: boolean('is_available').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Routes table
export const routesTable = pgTable('routes', {
  id: serial('id').primaryKey(),
  service_id: integer('service_id').notNull(),
  pickup_location: text('pickup_location').notNull(),
  destination: text('destination').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  duration_minutes: integer('duration_minutes'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Bookings table
export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  service_id: integer('service_id').notNull(),
  route_id: integer('route_id').notNull(),
  vehicle_id: integer('vehicle_id'),
  customer_name: text('customer_name').notNull(),
  customer_phone: text('customer_phone').notNull(),
  pickup_time: timestamp('pickup_time').notNull(),
  passenger_count: integer('passenger_count').notNull(),
  status: bookingStatusEnum('status').default('pending').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const carServicesRelations = relations(carServicesTable, ({ many }) => ({
  vehicles: many(vehiclesTable),
  routes: many(routesTable),
  bookings: many(bookingsTable),
}));

export const vehiclesRelations = relations(vehiclesTable, ({ one, many }) => ({
  service: one(carServicesTable, {
    fields: [vehiclesTable.service_id],
    references: [carServicesTable.id],
  }),
  bookings: many(bookingsTable),
}));

export const routesRelations = relations(routesTable, ({ one, many }) => ({
  service: one(carServicesTable, {
    fields: [routesTable.service_id],
    references: [carServicesTable.id],
  }),
  bookings: many(bookingsTable),
}));

export const bookingsRelations = relations(bookingsTable, ({ one }) => ({
  service: one(carServicesTable, {
    fields: [bookingsTable.service_id],
    references: [carServicesTable.id],
  }),
  route: one(routesTable, {
    fields: [bookingsTable.route_id],
    references: [routesTable.id],
  }),
  vehicle: one(vehiclesTable, {
    fields: [bookingsTable.vehicle_id],
    references: [vehiclesTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  carServices: carServicesTable,
  vehicles: vehiclesTable,
  routes: routesTable,
  bookings: bookingsTable,
};
