
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carServicesTable, bookingsTable, routesTable } from '../db/schema';
import { getBookings } from '../handlers/get_bookings';
import { type CreateCarServiceInput, type CreateRouteInput, type CreateBookingInput } from '../schema';

// Test data
const testService: CreateCarServiceInput = {
  name: 'Test Car Service',
  phone: '+1234567890',
  description: 'A service for testing'
};

const anotherService: CreateCarServiceInput = {
  name: 'Another Car Service',
  phone: '+0987654321',
  description: 'Another service for testing'
};

const testRoute: CreateRouteInput = {
  service_id: 1, // Will be set after service creation
  pickup_location: 'Airport',
  destination: 'City Center',
  price: 25.50,
  duration_minutes: 30
};

const testBooking: CreateBookingInput = {
  service_id: 1, // Will be set after service creation
  route_id: 1, // Will be set after route creation
  customer_name: 'John Doe',
  customer_phone: '+1111111111',
  pickup_time: new Date('2024-01-15T10:00:00Z'),
  passenger_count: 2,
  notes: 'Test booking'
};

describe('getBookings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no bookings exist', async () => {
    const result = await getBookings();
    expect(result).toEqual([]);
  });

  it('should return all bookings when no service filter is provided', async () => {
    // Create services
    const service1 = await db.insert(carServicesTable)
      .values(testService)
      .returning()
      .execute();

    const service2 = await db.insert(carServicesTable)
      .values(anotherService)
      .returning()
      .execute();

    // Create routes for both services
    const route1 = await db.insert(routesTable)
      .values({
        ...testRoute,
        service_id: service1[0].id,
        price: testRoute.price.toString()
      })
      .returning()
      .execute();

    const route2 = await db.insert(routesTable)
      .values({
        ...testRoute,
        service_id: service2[0].id,
        pickup_location: 'Hotel',
        destination: 'Airport',
        price: testRoute.price.toString()
      })
      .returning()
      .execute();

    // Create bookings for both services
    await db.insert(bookingsTable)
      .values({
        ...testBooking,
        service_id: service1[0].id,
        route_id: route1[0].id
      })
      .execute();

    await db.insert(bookingsTable)
      .values({
        ...testBooking,
        service_id: service2[0].id,
        route_id: route2[0].id,
        customer_name: 'Jane Smith'
      })
      .execute();

    const result = await getBookings();

    expect(result).toHaveLength(2);
    expect(result[0].customer_name).toEqual('John Doe');
    expect(result[1].customer_name).toEqual('Jane Smith');
    expect(result[0].service_id).toEqual(service1[0].id);
    expect(result[1].service_id).toEqual(service2[0].id);
  });

  it('should return bookings filtered by service ID', async () => {
    // Create services
    const service1 = await db.insert(carServicesTable)
      .values(testService)
      .returning()
      .execute();

    const service2 = await db.insert(carServicesTable)
      .values(anotherService)
      .returning()
      .execute();

    // Create routes for both services
    const route1 = await db.insert(routesTable)
      .values({
        ...testRoute,
        service_id: service1[0].id,
        price: testRoute.price.toString()
      })
      .returning()
      .execute();

    const route2 = await db.insert(routesTable)
      .values({
        ...testRoute,
        service_id: service2[0].id,
        pickup_location: 'Hotel',
        destination: 'Airport',
        price: testRoute.price.toString()
      })
      .returning()
      .execute();

    // Create bookings for both services
    await db.insert(bookingsTable)
      .values({
        ...testBooking,
        service_id: service1[0].id,
        route_id: route1[0].id
      })
      .execute();

    await db.insert(bookingsTable)
      .values({
        ...testBooking,
        service_id: service2[0].id,
        route_id: route2[0].id,
        customer_name: 'Jane Smith'
      })
      .execute();

    const result = await getBookings(service1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].customer_name).toEqual('John Doe');
    expect(result[0].service_id).toEqual(service1[0].id);
  });

  it('should return empty array when filtering by non-existent service ID', async () => {
    // Create a service and booking
    const service = await db.insert(carServicesTable)
      .values(testService)
      .returning()
      .execute();

    const route = await db.insert(routesTable)
      .values({
        ...testRoute,
        service_id: service[0].id,
        price: testRoute.price.toString()
      })
      .returning()
      .execute();

    await db.insert(bookingsTable)
      .values({
        ...testBooking,
        service_id: service[0].id,
        route_id: route[0].id
      })
      .execute();

    const result = await getBookings(999); // Non-existent service ID

    expect(result).toEqual([]);
  });

  it('should return booking with correct field types', async () => {
    // Create service and route
    const service = await db.insert(carServicesTable)
      .values(testService)
      .returning()
      .execute();

    const route = await db.insert(routesTable)
      .values({
        ...testRoute,
        service_id: service[0].id,
        price: testRoute.price.toString()
      })
      .returning()
      .execute();

    await db.insert(bookingsTable)
      .values({
        ...testBooking,
        service_id: service[0].id,
        route_id: route[0].id
      })
      .execute();

    const result = await getBookings();

    expect(result).toHaveLength(1);
    const booking = result[0];

    // Verify field types
    expect(typeof booking.id).toBe('number');
    expect(typeof booking.service_id).toBe('number');
    expect(typeof booking.route_id).toBe('number');
    expect(typeof booking.customer_name).toBe('string');
    expect(typeof booking.customer_phone).toBe('string');
    expect(booking.pickup_time).toBeInstanceOf(Date);
    expect(typeof booking.passenger_count).toBe('number');
    expect(typeof booking.status).toBe('string');
    expect(booking.created_at).toBeInstanceOf(Date);

    // Verify field values
    expect(booking.customer_name).toEqual('John Doe');
    expect(booking.customer_phone).toEqual('+1111111111');
    expect(booking.passenger_count).toEqual(2);
    expect(booking.status).toEqual('pending');
    expect(booking.notes).toEqual('Test booking');
  });
});
