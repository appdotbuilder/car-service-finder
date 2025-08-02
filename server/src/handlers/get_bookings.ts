
import { db } from '../db';
import { bookingsTable } from '../db/schema';
import { type Booking } from '../schema';
import { eq } from 'drizzle-orm';

export async function getBookings(serviceId?: number): Promise<Booking[]> {
  try {
    // Build query conditionally
    const query = serviceId !== undefined
      ? db.select().from(bookingsTable).where(eq(bookingsTable.service_id, serviceId))
      : db.select().from(bookingsTable);

    const results = await query.execute();

    // Convert numeric fields back to numbers (none needed for bookings table)
    return results.map(booking => ({
      ...booking,
      // All fields are already correct types (number, string, Date, etc.)
    }));
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    throw error;
  }
}
