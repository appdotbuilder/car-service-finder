
import { db } from '../db';
import { routesTable, carServicesTable } from '../db/schema';
import { type CreateRouteInput, type Route } from '../schema';
import { eq } from 'drizzle-orm';

export const createRoute = async (input: CreateRouteInput): Promise<Route> => {
  try {
    // Verify that the car service exists
    const service = await db.select()
      .from(carServicesTable)
      .where(eq(carServicesTable.id, input.service_id))
      .execute();

    if (service.length === 0) {
      throw new Error(`Car service with id ${input.service_id} not found`);
    }

    // Insert route record
    const result = await db.insert(routesTable)
      .values({
        service_id: input.service_id,
        pickup_location: input.pickup_location,
        destination: input.destination,
        price: input.price.toString(), // Convert number to string for numeric column
        duration_minutes: input.duration_minutes // Optional integer - no conversion needed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const route = result[0];
    return {
      ...route,
      price: parseFloat(route.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Route creation failed:', error);
    throw error;
  }
};
