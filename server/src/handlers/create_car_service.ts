
import { db } from '../db';
import { carServicesTable } from '../db/schema';
import { type CreateCarServiceInput, type CarService } from '../schema';

export const createCarService = async (input: CreateCarServiceInput): Promise<CarService> => {
  try {
    // Insert car service record
    const result = await db.insert(carServicesTable)
      .values({
        name: input.name,
        phone: input.phone,
        description: input.description || null
      })
      .returning()
      .execute();

    const carService = result[0];
    return {
      ...carService,
      // No numeric conversions needed - all fields are already correct types
    };
  } catch (error) {
    console.error('Car service creation failed:', error);
    throw error;
  }
};
