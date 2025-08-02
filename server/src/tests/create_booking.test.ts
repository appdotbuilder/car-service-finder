
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookingsTable, carServicesTable, routesTable, vehiclesTable } from '../db/schema';
import { type CreateBookingInput } from '../schema';
import { createBooking } from '../handlers/create_booking';
import { eq } from 'drizzle-orm';

describe('createBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let serviceId: number;
  let routeId: number;
  let vehicleId: number;

  beforeEach(async () => {
    // Create prerequisite service
    const serviceResult = await db.insert(carServicesTable)
      .values({
        name: 'Test Service',
        phone: '123-456-7890',
        description: 'Test service description'
      })
      .returning()
      .execute();
    serviceId = serviceResult[0].id;

    // Create prerequisite route
    const routeResult = await db.insert(routesTable)
      .values({
        service_id: serviceId,
        pickup_location: 'Downtown',
        destination: 'Airport',
        price: '25.50'
      })
      .returning()
      .execute();
    routeId = routeResult[0].id;

    // Create prerequisite vehicle
    const vehicleResult = await db.insert(vehiclesTable)
      .values({
        service_id: serviceId,
        type: '4-seater',
        capacity: 4,
        description: 'Test vehicle'
      })
      .returning()
      .execute();
    vehicleId = vehicleResult[0].id;
  });

  const testInput: CreateBookingInput = {
    service_id: 0, // Will be set in test
    route_id: 0, // Will be set in test
    vehicle_id: 0, // Will be set in test
    customer_name: 'John Doe',
    customer_phone: '555-0123',
    pickup_time: new Date('2024-12-25T10:00:00Z'),
    passenger_count: 2,
    notes: 'Please call upon arrival'
  };

  it('should create a booking with vehicle', async () => {
    const input = {
      ...testInput,
      service_id: serviceId,
      route_id: routeId,
      vehicle_id: vehicleId
    };

    const result = await createBooking(input);

    expect(result.service_id).toEqual(serviceId);
    expect(result.route_id).toEqual(routeId);
    expect(result.vehicle_id).toEqual(vehicleId);
    expect(result.customer_name).toEqual('John Doe');
    expect(result.customer_phone).toEqual('555-0123');
    expect(result.pickup_time).toEqual(new Date('2024-12-25T10:00:00Z'));
    expect(result.passenger_count).toEqual(2);
    expect(result.status).toEqual('pending');
    expect(result.notes).toEqual('Please call upon arrival');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a booking without vehicle', async () => {
    const input = {
      ...testInput,
      service_id: serviceId,
      route_id: routeId,
      vehicle_id: undefined
    };

    const result = await createBooking(input);

    expect(result.service_id).toEqual(serviceId);
    expect(result.route_id).toEqual(routeId);
    expect(result.vehicle_id).toBeNull();
    expect(result.customer_name).toEqual('John Doe');
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save booking to database', async () => {
    const input = {
      ...testInput,
      service_id: serviceId,
      route_id: routeId,
      vehicle_id: vehicleId
    };

    const result = await createBooking(input);

    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, result.id))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].customer_name).toEqual('John Doe');
    expect(bookings[0].customer_phone).toEqual('555-0123');
    expect(bookings[0].passenger_count).toEqual(2);
    expect(bookings[0].status).toEqual('pending');
    expect(bookings[0].notes).toEqual('Please call upon arrival');
    expect(bookings[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error if service does not exist', async () => {
    const input = {
      ...testInput,
      service_id: 99999,
      route_id: routeId,
      vehicle_id: vehicleId
    };

    await expect(createBooking(input)).rejects.toThrow(/Service with ID 99999 not found/i);
  });

  it('should throw error if route does not exist', async () => {
    const input = {
      ...testInput,
      service_id: serviceId,
      route_id: 99999,
      vehicle_id: vehicleId
    };

    await expect(createBooking(input)).rejects.toThrow(/Route with ID 99999 not found/i);
  });

  it('should throw error if route does not belong to service', async () => {
    // Create another service and route
    const anotherServiceResult = await db.insert(carServicesTable)
      .values({
        name: 'Another Service',
        phone: '987-654-3210'
      })
      .returning()
      .execute();

    const anotherRouteResult = await db.insert(routesTable)
      .values({
        service_id: anotherServiceResult[0].id,
        pickup_location: 'Mall',
        destination: 'Hotel',
        price: '15.00'
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      service_id: serviceId,
      route_id: anotherRouteResult[0].id,
      vehicle_id: vehicleId
    };

    await expect(createBooking(input)).rejects.toThrow(/Route .* does not belong to service/i);
  });

  it('should throw error if vehicle does not exist', async () => {
    const input = {
      ...testInput,
      service_id: serviceId,
      route_id: routeId,
      vehicle_id: 99999
    };

    await expect(createBooking(input)).rejects.toThrow(/Vehicle with ID 99999 not found/i);
  });

  it('should throw error if vehicle does not belong to service', async () => {
    // Create another service and vehicle
    const anotherServiceResult = await db.insert(carServicesTable)
      .values({
        name: 'Another Service',
        phone: '987-654-3210'
      })
      .returning()
      .execute();

    const anotherVehicleResult = await db.insert(vehiclesTable)
      .values({
        service_id: anotherServiceResult[0].id,
        type: '7-seater',
        capacity: 7
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      service_id: serviceId,
      route_id: routeId,
      vehicle_id: anotherVehicleResult[0].id
    };

    await expect(createBooking(input)).rejects.toThrow(/Vehicle .* does not belong to service/i);
  });
});
