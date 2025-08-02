
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carServicesTable } from '../db/schema';
import { type CreateCarServiceInput } from '../schema';
import { getCarServices } from '../handlers/get_car_services';
import { eq } from 'drizzle-orm';

describe('getCarServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no services exist', async () => {
    const result = await getCarServices();
    expect(result).toEqual([]);
  });

  it('should return all active car services', async () => {
    // Create test car services
    await db.insert(carServicesTable)
      .values([
        {
          name: 'Fast Transport',
          phone: '+1234567890',
          description: 'Quick and reliable transport',
          is_active: true
        },
        {
          name: 'City Rides',
          phone: '+0987654321',
          description: 'Urban transportation service',
          is_active: true
        }
      ])
      .execute();

    const result = await getCarServices();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Fast Transport');
    expect(result[0].phone).toEqual('+1234567890');
    expect(result[0].description).toEqual('Quick and reliable transport');
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('City Rides');
    expect(result[1].phone).toEqual('+0987654321');
    expect(result[1].description).toEqual('Urban transportation service');
    expect(result[1].is_active).toBe(true);
  });

  it('should only return active car services', async () => {
    // Create mix of active and inactive services
    await db.insert(carServicesTable)
      .values([
        {
          name: 'Active Service',
          phone: '+1111111111',
          description: 'This service is active',
          is_active: true
        },
        {
          name: 'Inactive Service',
          phone: '+2222222222',
          description: 'This service is inactive',
          is_active: false
        }
      ])
      .execute();

    const result = await getCarServices();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Active Service');
    expect(result[0].is_active).toBe(true);
  });

  it('should handle null description correctly', async () => {
    // Create service with null description
    await db.insert(carServicesTable)
      .values({
        name: 'Simple Service',
        phone: '+5555555555',
        description: null,
        is_active: true
      })
      .execute();

    const result = await getCarServices();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Simple Service');
    expect(result[0].description).toBeNull();
    expect(result[0].is_active).toBe(true);
  });

  it('should verify services are saved correctly in database', async () => {
    // Create test service
    const testService = {
      name: 'Test Transport',
      phone: '+9999999999',
      description: 'Testing service',
      is_active: true
    };

    await db.insert(carServicesTable)
      .values(testService)
      .execute();

    // Query database directly to verify
    const dbServices = await db.select()
      .from(carServicesTable)
      .where(eq(carServicesTable.name, 'Test Transport'))
      .execute();

    expect(dbServices).toHaveLength(1);
    expect(dbServices[0].name).toEqual('Test Transport');
    expect(dbServices[0].phone).toEqual('+9999999999');
    expect(dbServices[0].description).toEqual('Testing service');
    expect(dbServices[0].is_active).toBe(true);
    expect(dbServices[0].created_at).toBeInstanceOf(Date);

    // Verify handler returns the same data
    const handlerResult = await getCarServices();
    expect(handlerResult).toHaveLength(1);
    expect(handlerResult[0]).toEqual(dbServices[0]);
  });
});
