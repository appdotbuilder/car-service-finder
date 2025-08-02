
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { routesTable, carServicesTable } from '../db/schema';
import { type CreateRouteInput } from '../schema';
import { createRoute } from '../handlers/create_route';
import { eq } from 'drizzle-orm';

// Test service for foreign key reference
const testService = {
  name: 'Test Car Service',
  phone: '+1234567890',
  description: 'A test car service'
};

// Test route input
const testInput: CreateRouteInput = {
  service_id: 1, // Will be set after creating test service
  pickup_location: 'Airport Terminal 1',
  destination: 'City Center Mall',
  price: 25.50,
  duration_minutes: 45
};

describe('createRoute', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a route', async () => {
    // Create prerequisite car service
    const serviceResult = await db.insert(carServicesTable)
      .values(testService)
      .returning()
      .execute();
    
    const input = { ...testInput, service_id: serviceResult[0].id };
    const result = await createRoute(input);

    // Basic field validation
    expect(result.service_id).toEqual(serviceResult[0].id);
    expect(result.pickup_location).toEqual('Airport Terminal 1');
    expect(result.destination).toEqual('City Center Mall');
    expect(result.price).toEqual(25.50);
    expect(typeof result.price).toEqual('number');
    expect(result.duration_minutes).toEqual(45);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save route to database', async () => {
    // Create prerequisite car service
    const serviceResult = await db.insert(carServicesTable)
      .values(testService)
      .returning()
      .execute();
    
    const input = { ...testInput, service_id: serviceResult[0].id };
    const result = await createRoute(input);

    // Query using proper drizzle syntax
    const routes = await db.select()
      .from(routesTable)
      .where(eq(routesTable.id, result.id))
      .execute();

    expect(routes).toHaveLength(1);
    expect(routes[0].service_id).toEqual(serviceResult[0].id);
    expect(routes[0].pickup_location).toEqual('Airport Terminal 1');
    expect(routes[0].destination).toEqual('City Center Mall');
    expect(parseFloat(routes[0].price)).toEqual(25.50);
    expect(routes[0].duration_minutes).toEqual(45);
    expect(routes[0].is_active).toEqual(true);
    expect(routes[0].created_at).toBeInstanceOf(Date);
  });

  it('should create route without duration_minutes', async () => {
    // Create prerequisite car service
    const serviceResult = await db.insert(carServicesTable)
      .values(testService)
      .returning()
      .execute();
    
    const inputWithoutDuration = {
      service_id: serviceResult[0].id,
      pickup_location: 'Downtown Station',
      destination: 'Airport Terminal 2',
      price: 30.00
    };

    const result = await createRoute(inputWithoutDuration);

    expect(result.service_id).toEqual(serviceResult[0].id);
    expect(result.pickup_location).toEqual('Downtown Station');
    expect(result.destination).toEqual('Airport Terminal 2');
    expect(result.price).toEqual(30.00);
    expect(result.duration_minutes).toBeNull();
    expect(result.is_active).toEqual(true);
  });

  it('should throw error when service does not exist', async () => {
    const inputWithInvalidService = { ...testInput, service_id: 999 };

    await expect(createRoute(inputWithInvalidService)).rejects.toThrow(/service.*not found/i);
  });
});
