
import { db } from '../db';
import { bookingsTable, carServicesTable, routesTable, vehiclesTable } from '../db/schema';
import { type CreateBookingInput, type Booking } from '../schema';
import { eq } from 'drizzle-orm';

export const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
  try {
    // Verify that the service exists
    const service = await db.select()
      .from(carServicesTable)
      .where(eq(carServicesTable.id, input.service_id))
      .execute();

    if (service.length === 0) {
      throw new Error(`Service with ID ${input.service_id} not found`);
    }

    // Verify that the route exists and belongs to the service
    const route = await db.select()
      .from(routesTable)
      .where(eq(routesTable.id, input.route_id))
      .execute();

    if (route.length === 0) {
      throw new Error(`Route with ID ${input.route_id} not found`);
    }

    if (route[0].service_id !== input.service_id) {
      throw new Error(`Route ${input.route_id} does not belong to service ${input.service_id}`);
    }

    // If vehicle_id is provided, verify it exists and belongs to the service
    if (input.vehicle_id) {
      const vehicle = await db.select()
        .from(vehiclesTable)
        .where(eq(vehiclesTable.id, input.vehicle_id))
        .execute();

      if (vehicle.length === 0) {
        throw new Error(`Vehicle with ID ${input.vehicle_id} not found`);
      }

      if (vehicle[0].service_id !== input.service_id) {
        throw new Error(`Vehicle ${input.vehicle_id} does not belong to service ${input.service_id}`);
      }
    }

    // Insert booking record
    const result = await db.insert(bookingsTable)
      .values({
        service_id: input.service_id,
        route_id: input.route_id,
        vehicle_id: input.vehicle_id || null,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        pickup_time: input.pickup_time,
        passenger_count: input.passenger_count,
        notes: input.notes || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Booking creation failed:', error);
    throw error;
  }
};
