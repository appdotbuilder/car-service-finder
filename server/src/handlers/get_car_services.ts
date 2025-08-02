
import { db } from '../db';
import { carServicesTable } from '../db/schema';
import { type CarService } from '../schema';
import { eq } from 'drizzle-orm';

export const getCarServices = async (): Promise<CarService[]> => {
  try {
    // Query for all active car services
    const results = await db.select()
      .from(carServicesTable)
      .where(eq(carServicesTable.is_active, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Get car services failed:', error);
    throw error;
  }
};
