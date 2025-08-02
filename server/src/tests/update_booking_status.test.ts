
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carServicesTable, routesTable, bookingsTable } from '../db/schema';
import { type UpdateBookingStatusInput, type CreateCarServiceInput, type CreateRouteInput, type CreateBookingInput } from '../schema';
import { updateBookingStatus } from '../handlers/update_booking_status';
import { eq } from 'drizzle-orm';

describe('updateBookingStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update booking status from pending to confirmed', async () => {
    // Create prerequisite service
    const serviceResult = await db.insert(carServicesTable)
      .values({
        name: 'Test Service',
        phone: '123-456-7890',
        description: 'Test service description'
      })
      .returning()
      .execute();
    const serviceId = serviceResult[0].id;

    // Create prerequisite route
    const routeResult = await db.insert(routesTable)
      .values({
        service_id: serviceId,
        pickup_location: 'Downtown',
        destination: 'Airport',
        price: '25.00'
      })
      .returning()
      .execute();
    const routeId = routeResult[0].id;

    // Create test booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        service_id: serviceId,
        route_id: routeId,
        customer_name: 'John Doe',
        customer_phone: '555-0123',
        pickup_time: new Date('2024-01-15T10:00:00Z'),
        passenger_count: 2,
        status: 'pending'
      })
      .returning()
      .execute();
    const bookingId = bookingResult[0].id;

    const input: UpdateBookingStatusInput = {
      id: bookingId,
      status: 'confirmed'
    };

    const result = await updateBookingStatus(input);

    // Verify status was updated
    expect(result.id).toEqual(bookingId);
    expect(result.status).toEqual('confirmed');
    expect(result.service_id).toEqual(serviceId);
    expect(result.route_id).toEqual(routeId);
    expect(result.customer_name).toEqual('John Doe');
    expect(result.customer_phone).toEqual('555-0123');
    expect(result.passenger_count).toEqual(2);
  });

  it('should update booking status from confirmed to completed', async () => {
    // Create prerequisite service
    const serviceResult = await db.insert(carServicesTable)
      .values({
        name: 'Test Service',
        phone: '123-456-7890'
      })
      .returning()
      .execute();
    const serviceId = serviceResult[0].id;

    // Create prerequisite route
    const routeResult = await db.insert(routesTable)
      .values({
        service_id: serviceId,
        pickup_location: 'Hotel',
        destination: 'Station',
        price: '15.50'
      })
      .returning()
      .execute();
    const routeId = routeResult[0].id;

    // Create test booking with confirmed status
    const bookingResult = await db.insert(bookingsTable)
      .values({
        service_id: serviceId,
        route_id: routeId,
        customer_name: 'Jane Smith',
        customer_phone: '555-0456',
        pickup_time: new Date('2024-01-16T14:30:00Z'),
        passenger_count: 1,
        status: 'confirmed'
      })
      .returning()
      .execute();
    const bookingId = bookingResult[0].id;

    const input: UpdateBookingStatusInput = {
      id: bookingId,
      status: 'completed'
    };

    const result = await updateBookingStatus(input);

    expect(result.status).toEqual('completed');
    expect(result.id).toEqual(bookingId);
  });

  it('should save updated status to database', async () => {
    // Create prerequisite service
    const serviceResult = await db.insert(carServicesTable)
      .values({
        name: 'Test Service',
        phone: '123-456-7890'
      })
      .returning()
      .execute();
    const serviceId = serviceResult[0].id;

    // Create prerequisite route
    const routeResult = await db.insert(routesTable)
      .values({
        service_id: serviceId,
        pickup_location: 'Mall',
        destination: 'Airport',
        price: '30.00'
      })
      .returning()
      .execute();
    const routeId = routeResult[0].id;

    // Create test booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        service_id: serviceId,
        route_id: routeId,
        customer_name: 'Bob Wilson',
        customer_phone: '555-0789',
        pickup_time: new Date('2024-01-17T09:00:00Z'),
        passenger_count: 3,
        status: 'pending'
      })
      .returning()
      .execute();
    const bookingId = bookingResult[0].id;

    const input: UpdateBookingStatusInput = {
      id: bookingId,
      status: 'cancelled'
    };

    await updateBookingStatus(input);

    // Verify in database
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].status).toEqual('cancelled');
    expect(bookings[0].customer_name).toEqual('Bob Wilson');
  });

  it('should throw error for non-existent booking', async () => {
    const input: UpdateBookingStatusInput = {
      id: 99999,
      status: 'confirmed'
    };

    expect(updateBookingStatus(input)).rejects.toThrow(/not found/i);
  });

  it('should handle all booking status values', async () => {
    // Create prerequisite service
    const serviceResult = await db.insert(carServicesTable)
      .values({
        name: 'Test Service',
        phone: '123-456-7890'
      })
      .returning()
      .execute();
    const serviceId = serviceResult[0].id;

    // Create prerequisite route
    const routeResult = await db.insert(routesTable)
      .values({
        service_id: serviceId,
        pickup_location: 'Office',
        destination: 'Home',
        price: '12.75'
      })
      .returning()
      .execute();
    const routeId = routeResult[0].id;

    // Create test booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        service_id: serviceId,
        route_id: routeId,
        customer_name: 'Alice Brown',
        customer_phone: '555-0321',
        pickup_time: new Date('2024-01-18T16:45:00Z'),
        passenger_count: 1,
        status: 'pending'
      })
      .returning()
      .execute();
    const bookingId = bookingResult[0].id;

    // Test each status value
    const statuses = ['confirmed', 'completed', 'cancelled', 'pending'] as const;
    
    for (const status of statuses) {
      const input: UpdateBookingStatusInput = {
        id: bookingId,
        status: status
      };

      const result = await updateBookingStatus(input);
      expect(result.status).toEqual(status);
    }
  });
});
