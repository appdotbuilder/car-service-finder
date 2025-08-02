
import { db } from '../db';
import { vehiclesTable, carServicesTable } from '../db/schema';
import { type CreateVehicleInput, type Vehicle } from '../schema';
import { eq } from 'drizzle-orm';

export const createVehicle = async (input: CreateVehicleInput): Promise<Vehicle> => {
  try {
    // Verify that the car service exists first to prevent foreign key constraint errors
    const serviceExists = await db.select()
      .from(carServicesTable)
      .where(eq(carServicesTable.id, input.service_id))
      .execute();

    if (serviceExists.length === 0) {
      throw new Error(`Car service with ID ${input.service_id} not found`);
    }

    // Insert vehicle record
    const result = await db.insert(vehiclesTable)
      .values({
        service_id: input.service_id,
        type: input.type,
        capacity: input.capacity,
        description: input.description || null
      })
      .returning()
      .execute();

    const vehicle = result[0];
    return vehicle;
  } catch (error) {
    console.error('Vehicle creation failed:', error);
    throw error;
  }
};
