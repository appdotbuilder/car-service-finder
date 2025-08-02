
import { z } from 'zod';

// Vehicle type enum
export const vehicleTypeSchema = z.enum(['4-seater', '7-seater', '16-seater', 'other']);
export type VehicleType = z.infer<typeof vehicleTypeSchema>;

// Car service provider schema
export const carServiceSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});
export type CarService = z.infer<typeof carServiceSchema>;

// Vehicle schema
export const vehicleSchema = z.object({
  id: z.number(),
  service_id: z.number(),
  type: vehicleTypeSchema,
  capacity: z.number().int(),
  description: z.string().nullable(),
  is_available: z.boolean(),
  created_at: z.coerce.date()
});
export type Vehicle = z.infer<typeof vehicleSchema>;

// Route schema
export const routeSchema = z.object({
  id: z.number(),
  service_id: z.number(),
  pickup_location: z.string(),
  destination: z.string(),
  price: z.number(),
  duration_minutes: z.number().int().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});
export type Route = z.infer<typeof routeSchema>;

// Booking status enum
export const bookingStatusSchema = z.enum(['pending', 'confirmed', 'completed', 'cancelled']);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

// Booking schema
export const bookingSchema = z.object({
  id: z.number(),
  service_id: z.number(),
  route_id: z.number(),
  vehicle_id: z.number().nullable(),
  customer_name: z.string(),
  customer_phone: z.string(),
  pickup_time: z.coerce.date(),
  passenger_count: z.number().int(),
  status: bookingStatusSchema,
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});
export type Booking = z.infer<typeof bookingSchema>;

// Search input schema
export const searchServicesInputSchema = z.object({
  pickup_location: z.string().optional(),
  destination: z.string().optional(),
  vehicle_type: vehicleTypeSchema.optional(),
  pickup_time: z.coerce.date().optional(),
  passenger_count: z.number().int().optional()
});
export type SearchServicesInput = z.infer<typeof searchServicesInputSchema>;

// Create car service input schema
export const createCarServiceInputSchema = z.object({
  name: z.string(),
  phone: z.string(),
  description: z.string().nullable().optional()
});
export type CreateCarServiceInput = z.infer<typeof createCarServiceInputSchema>;

// Create vehicle input schema
export const createVehicleInputSchema = z.object({
  service_id: z.number(),
  type: vehicleTypeSchema,
  capacity: z.number().int().positive(),
  description: z.string().nullable().optional()
});
export type CreateVehicleInput = z.infer<typeof createVehicleInputSchema>;

// Create route input schema
export const createRouteInputSchema = z.object({
  service_id: z.number(),
  pickup_location: z.string(),
  destination: z.string(),
  price: z.number().positive(),
  duration_minutes: z.number().int().positive().optional()
});
export type CreateRouteInput = z.infer<typeof createRouteInputSchema>;

// Create booking input schema
export const createBookingInputSchema = z.object({
  service_id: z.number(),
  route_id: z.number(),
  vehicle_id: z.number().optional(),
  customer_name: z.string(),
  customer_phone: z.string(),
  pickup_time: z.coerce.date(),
  passenger_count: z.number().int().positive(),
  notes: z.string().nullable().optional()
});
export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

// Update booking status input schema
export const updateBookingStatusInputSchema = z.object({
  id: z.number(),
  status: bookingStatusSchema
});
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusInputSchema>;
