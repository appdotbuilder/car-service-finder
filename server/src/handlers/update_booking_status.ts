
import { db } from '../db';
import { bookingsTable } from '../db/schema';
import { type UpdateBookingStatusInput, type Booking } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateBookingStatus(input: UpdateBookingStatusInput): Promise<Booking> {
  try {
    // Update booking status
    const result = await db.update(bookingsTable)
      .set({
        status: input.status
      })
      .where(eq(bookingsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Booking with id ${input.id} not found`);
    }

    // Return the booking (no numeric conversions needed for bookings table)
    const booking = result[0];
    return booking;
  } catch (error) {
    console.error('Booking status update failed:', error);
    throw error;
  }
}
