
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carServicesTable } from '../db/schema';
import { type CreateCarServiceInput } from '../schema';
import { createCarService } from '../handlers/create_car_service';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateCarServiceInput = {
  name: 'Test Car Service',
  phone: '+1234567890',
  description: 'A reliable car service for testing'
};

// Test input without optional description
const minimalInput: CreateCarServiceInput = {
  name: 'Minimal Service',
  phone: '+0987654321'
};

describe('createCarService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a car service with all fields', async () => {
    const result = await createCarService(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Car Service');
    expect(result.phone).toEqual('+1234567890');
    expect(result.description).toEqual('A reliable car service for testing');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a car service with minimal required fields', async () => {
    const result = await createCarService(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Minimal Service');
    expect(result.phone).toEqual('+0987654321');
    expect(result.description).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save car service to database', async () => {
    const result = await createCarService(testInput);

    // Query using proper drizzle syntax
    const carServices = await db.select()
      .from(carServicesTable)
      .where(eq(carServicesTable.id, result.id))
      .execute();

    expect(carServices).toHaveLength(1);
    expect(carServices[0].name).toEqual('Test Car Service');
    expect(carServices[0].phone).toEqual('+1234567890');
    expect(carServices[0].description).toEqual('A reliable car service for testing');
    expect(carServices[0].is_active).toBe(true);
    expect(carServices[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const result = await createCarService(minimalInput);

    // Query database to verify null handling
    const carServices = await db.select()
      .from(carServicesTable)
      .where(eq(carServicesTable.id, result.id))
      .execute();

    expect(carServices[0].description).toBeNull();
  });

  it('should set default values correctly', async () => {
    const result = await createCarService(testInput);

    // Verify default values are applied
    expect(result.is_active).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify created_at is recent (within last minute)
    const now = new Date();
    const timeDiff = now.getTime() - result.created_at.getTime();
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
  });
});
