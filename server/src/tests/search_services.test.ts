
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carServicesTable, vehiclesTable, routesTable } from '../db/schema';
import { type SearchServicesInput } from '../schema';
import { searchServices } from '../handlers/search_services';

describe('searchServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup helpers
  const createTestService = async (name: string = 'Test Service') => {
    const result = await db.insert(carServicesTable)
      .values({
        name,
        phone: '123-456-7890',
        description: 'Test service description',
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestVehicle = async (serviceId: number, type: '4-seater' | '7-seater' | '16-seater' | 'other' = '4-seater', capacity: number = 4) => {
    const result = await db.insert(vehiclesTable)
      .values({
        service_id: serviceId,
        type,
        capacity,
        description: 'Test vehicle',
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestRoute = async (serviceId: number, pickup: string = 'Airport', destination: string = 'City Center') => {
    const result = await db.insert(routesTable)
      .values({
        service_id: serviceId,
        pickup_location: pickup,
        destination,
        price: '25.00',
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should return all active services when no filters provided', async () => {
    // Create test services
    const service1 = await createTestService('Service 1');
    const service2 = await createTestService('Service 2');
    
    // Create inactive service (should not be returned)
    await db.insert(carServicesTable)
      .values({
        name: 'Inactive Service',
        phone: '999-999-9999',
        is_active: false,
      })
      .execute();

    const input: SearchServicesInput = {};
    const result = await searchServices(input);

    expect(result).toHaveLength(2);
    expect(result.map(s => s.name)).toContain('Service 1');
    expect(result.map(s => s.name)).toContain('Service 2');
    expect(result.map(s => s.name)).not.toContain('Inactive Service');
  });

  it('should filter by pickup location', async () => {
    const service1 = await createTestService('Service 1');
    const service2 = await createTestService('Service 2');
    
    // Create routes
    await createTestRoute(service1.id, 'Airport', 'City Center');
    await createTestRoute(service2.id, 'Hotel', 'City Center');

    const input: SearchServicesInput = {
      pickup_location: 'Airport'
    };
    const result = await searchServices(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Service 1');
  });

  it('should filter by destination', async () => {
    const service1 = await createTestService('Service 1');
    const service2 = await createTestService('Service 2');
    
    // Create routes
    await createTestRoute(service1.id, 'Airport', 'Beach');
    await createTestRoute(service2.id, 'Airport', 'City Center');

    const input: SearchServicesInput = {
      destination: 'Beach'
    };
    const result = await searchServices(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Service 1');
  });

  it('should filter by vehicle type', async () => {
    const service1 = await createTestService('Service 1');
    const service2 = await createTestService('Service 2');
    
    // Create vehicles
    await createTestVehicle(service1.id, '7-seater', 7);
    await createTestVehicle(service2.id, '4-seater', 4);

    const input: SearchServicesInput = {
      vehicle_type: '7-seater'
    };
    const result = await searchServices(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Service 1');
  });

  it('should filter by passenger count capacity', async () => {
    const service1 = await createTestService('Service 1');
    const service2 = await createTestService('Service 2');
    
    // Create vehicles with different capacities
    await createTestVehicle(service1.id, '7-seater', 7);
    await createTestVehicle(service2.id, '4-seater', 4);

    const input: SearchServicesInput = {
      passenger_count: 6
    };
    const result = await searchServices(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Service 1');
  });

  it('should combine multiple filters', async () => {
    const service1 = await createTestService('Service 1');
    const service2 = await createTestService('Service 2');
    const service3 = await createTestService('Service 3');
    
    // Service 1: Airport -> Beach, 7-seater
    await createTestRoute(service1.id, 'Airport', 'Beach');
    await createTestVehicle(service1.id, '7-seater', 7);
    
    // Service 2: Airport -> Beach, 4-seater
    await createTestRoute(service2.id, 'Airport', 'Beach');
    await createTestVehicle(service2.id, '4-seater', 4);
    
    // Service 3: Hotel -> Beach, 7-seater
    await createTestRoute(service3.id, 'Hotel', 'Beach');
    await createTestVehicle(service3.id, '7-seater', 7);

    const input: SearchServicesInput = {
      pickup_location: 'Airport',
      destination: 'Beach',
      vehicle_type: '7-seater'
    };
    const result = await searchServices(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Service 1');
  });

  it('should not return services with inactive routes', async () => {
    const service1 = await createTestService('Service 1');
    
    // Create inactive route
    await db.insert(routesTable)
      .values({
        service_id: service1.id,
        pickup_location: 'Airport',
        destination: 'City Center',
        price: '25.00',
        is_active: false,
      })
      .execute();

    const input: SearchServicesInput = {
      pickup_location: 'Airport'
    };
    const result = await searchServices(input);

    expect(result).toHaveLength(0);
  });

  it('should not return services with unavailable vehicles', async () => {
    const service1 = await createTestService('Service 1');
    
    // Create unavailable vehicle
    await db.insert(vehiclesTable)
      .values({
        service_id: service1.id,
        type: '4-seater',
        capacity: 4,
        is_available: false,
      })
      .execute();

    const input: SearchServicesInput = {
      vehicle_type: '4-seater'
    };
    const result = await searchServices(input);

    expect(result).toHaveLength(0);
  });

  it('should return unique services when multiple matches exist', async () => {
    const service1 = await createTestService('Service 1');
    
    // Create multiple routes for same service
    await createTestRoute(service1.id, 'Airport', 'Beach');
    await createTestRoute(service1.id, 'Airport', 'City Center');

    const input: SearchServicesInput = {
      pickup_location: 'Airport'
    };
    const result = await searchServices(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Service 1');
  });

  it('should return empty array when no services match criteria', async () => {
    const service1 = await createTestService('Service 1');
    await createTestRoute(service1.id, 'Hotel', 'Beach');

    const input: SearchServicesInput = {
      pickup_location: 'Airport'
    };
    const result = await searchServices(input);

    expect(result).toHaveLength(0);
  });

  it('should handle route and vehicle filters together', async () => {
    const service1 = await createTestService('Service 1');
    const service2 = await createTestService('Service 2');
    
    // Service 1: Airport -> Beach, 4-seater (capacity 4)
    await createTestRoute(service1.id, 'Airport', 'Beach');
    await createTestVehicle(service1.id, '4-seater', 4);
    
    // Service 2: Airport -> Beach, 7-seater (capacity 7)
    await createTestRoute(service2.id, 'Airport', 'Beach');
    await createTestVehicle(service2.id, '7-seater', 7);

    const input: SearchServicesInput = {
      pickup_location: 'Airport',
      destination: 'Beach',
      passenger_count: 6
    };
    const result = await searchServices(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Service 2');
  });
});
