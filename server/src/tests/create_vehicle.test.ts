
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vehiclesTable, carServicesTable } from '../db/schema';
import { type CreateVehicleInput } from '../schema';
import { createVehicle } from '../handlers/create_vehicle';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateVehicleInput = {
  service_id: 1,
  type: '4-seater',
  capacity: 4,
  description: 'Comfortable sedan vehicle'
};

describe('createVehicle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a vehicle', async () => {
    // Create prerequisite car service first
    await db.insert(carServicesTable)
      .values({
        name: 'Test Car Service',
        phone: '1234567890',
        description: 'Test service'
      })
      .execute();

    const result = await createVehicle(testInput);

    // Basic field validation
    expect(result.service_id).toEqual(1);
    expect(result.type).toEqual('4-seater');
    expect(result.capacity).toEqual(4);
    expect(result.description).toEqual('Comfortable sedan vehicle');
    expect(result.is_available).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save vehicle to database', async () => {
    // Create prerequisite car service
    await db.insert(carServicesTable)
      .values({
        name: 'Test Car Service',
        phone: '1234567890',
        description: 'Test service'
      })
      .execute();

    const result = await createVehicle(testInput);

    // Query using proper drizzle syntax
    const vehicles = await db.select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.id, result.id))
      .execute();

    expect(vehicles).toHaveLength(1);
    expect(vehicles[0].service_id).toEqual(1);
    expect(vehicles[0].type).toEqual('4-seater');
    expect(vehicles[0].capacity).toEqual(4);
    expect(vehicles[0].description).toEqual('Comfortable sedan vehicle');
    expect(vehicles[0].is_available).toEqual(true);
    expect(vehicles[0].created_at).toBeInstanceOf(Date);
  });

  it('should create vehicle without description', async () => {
    // Create prerequisite car service
    await db.insert(carServicesTable)
      .values({
        name: 'Test Car Service',
        phone: '1234567890'
      })
      .execute();

    const inputWithoutDescription: CreateVehicleInput = {
      service_id: 1,
      type: '7-seater',
      capacity: 7
    };

    const result = await createVehicle(inputWithoutDescription);

    expect(result.service_id).toEqual(1);
    expect(result.type).toEqual('7-seater');
    expect(result.capacity).toEqual(7);
    expect(result.description).toBeNull();
    expect(result.is_available).toEqual(true);
  });

  it('should handle different vehicle types', async () => {
    // Create prerequisite car service
    await db.insert(carServicesTable)
      .values({
        name: 'Test Car Service',
        phone: '1234567890'
      })
      .execute();

    const busInput: CreateVehicleInput = {
      service_id: 1,
      type: '16-seater',
      capacity: 16,
      description: 'Large bus for group transport'
    };

    const result = await createVehicle(busInput);

    expect(result.type).toEqual('16-seater');
    expect(result.capacity).toEqual(16);
    expect(result.description).toEqual('Large bus for group transport');
  });

  it('should throw error when car service does not exist', async () => {
    // Don't create any car service - test foreign key validation
    expect(createVehicle(testInput)).rejects.toThrow(/car service.*not found/i);
  });
});
