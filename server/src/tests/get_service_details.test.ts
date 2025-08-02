
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carServicesTable, vehiclesTable, routesTable } from '../db/schema';
import { getServiceDetails } from '../handlers/get_service_details';

describe('getServiceDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent service', async () => {
    const result = await getServiceDetails(999);
    expect(result).toBeNull();
  });

  it('should return service with empty vehicles and routes arrays', async () => {
    // Create a service without vehicles or routes
    const serviceResult = await db.insert(carServicesTable)
      .values({
        name: 'Test Service',
        phone: '123-456-7890',
        description: 'A test service'
      })
      .returning()
      .execute();

    const serviceId = serviceResult[0].id;
    const result = await getServiceDetails(serviceId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(serviceId);
    expect(result!.name).toEqual('Test Service');
    expect(result!.phone).toEqual('123-456-7890');
    expect(result!.description).toEqual('A test service');
    expect(result!.is_active).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.vehicles).toEqual([]);
    expect(result!.routes).toEqual([]);
  });

  it('should return service with vehicles and routes', async () => {
    // Create a service
    const serviceResult = await db.insert(carServicesTable)
      .values({
        name: 'Complete Service',
        phone: '555-0123',
        description: 'Full service with vehicles and routes'
      })
      .returning()
      .execute();

    const serviceId = serviceResult[0].id;

    // Create vehicles
    const vehiclesResult = await db.insert(vehiclesTable)
      .values([
        {
          service_id: serviceId,
          type: '4-seater',
          capacity: 4,
          description: 'Sedan car'
        },
        {
          service_id: serviceId,
          type: '7-seater',
          capacity: 7,
          description: 'SUV vehicle'
        }
      ])
      .returning()
      .execute();

    // Create routes
    const routesResult = await db.insert(routesTable)
      .values([
        {
          service_id: serviceId,
          pickup_location: 'Airport',
          destination: 'Downtown',
          price: '25.50',
          duration_minutes: 30
        },
        {
          service_id: serviceId,
          pickup_location: 'Hotel',
          destination: 'Mall',
          price: '15.75',
          duration_minutes: 20
        }
      ])
      .returning()
      .execute();

    const result = await getServiceDetails(serviceId);

    expect(result).not.toBeNull();
    
    // Check service details
    expect(result!.id).toEqual(serviceId);
    expect(result!.name).toEqual('Complete Service');
    expect(result!.phone).toEqual('555-0123');
    expect(result!.description).toEqual('Full service with vehicles and routes');
    expect(result!.is_active).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);

    // Check vehicles
    expect(result!.vehicles).toHaveLength(2);
    const vehicle1 = result!.vehicles.find(v => v.type === '4-seater');
    const vehicle2 = result!.vehicles.find(v => v.type === '7-seater');
    
    expect(vehicle1).toBeDefined();
    expect(vehicle1!.service_id).toEqual(serviceId);
    expect(vehicle1!.capacity).toEqual(4);
    expect(vehicle1!.description).toEqual('Sedan car');
    expect(vehicle1!.is_available).toBe(true);
    expect(vehicle1!.created_at).toBeInstanceOf(Date);

    expect(vehicle2).toBeDefined();
    expect(vehicle2!.service_id).toEqual(serviceId);
    expect(vehicle2!.capacity).toEqual(7);
    expect(vehicle2!.description).toEqual('SUV vehicle');
    expect(vehicle2!.is_available).toBe(true);
    expect(vehicle2!.created_at).toBeInstanceOf(Date);

    // Check routes
    expect(result!.routes).toHaveLength(2);
    const route1 = result!.routes.find(r => r.pickup_location === 'Airport');
    const route2 = result!.routes.find(r => r.pickup_location === 'Hotel');

    expect(route1).toBeDefined();
    expect(route1!.service_id).toEqual(serviceId);
    expect(route1!.destination).toEqual('Downtown');
    expect(route1!.price).toEqual(25.50);
    expect(typeof route1!.price).toBe('number');
    expect(route1!.duration_minutes).toEqual(30);
    expect(route1!.is_active).toBe(true);
    expect(route1!.created_at).toBeInstanceOf(Date);

    expect(route2).toBeDefined();
    expect(route2!.service_id).toEqual(serviceId);
    expect(route2!.destination).toEqual('Mall');
    expect(route2!.price).toEqual(15.75);
    expect(typeof route2!.price).toBe('number');
    expect(route2!.duration_minutes).toEqual(20);
    expect(route2!.is_active).toBe(true);
    expect(route2!.created_at).toBeInstanceOf(Date);
  });

  it('should only return vehicles and routes for the specified service', async () => {
    // Create two services
    const service1Result = await db.insert(carServicesTable)
      .values({
        name: 'Service 1',
        phone: '111-1111',
        description: 'First service'
      })
      .returning()
      .execute();

    const service2Result = await db.insert(carServicesTable)
      .values({
        name: 'Service 2',
        phone: '222-2222',
        description: 'Second service'
      })
      .returning()
      .execute();

    const service1Id = service1Result[0].id;
    const service2Id = service2Result[0].id;

    // Create vehicles for both services
    await db.insert(vehiclesTable)
      .values([
        {
          service_id: service1Id,
          type: '4-seater',
          capacity: 4,
          description: 'Service 1 vehicle'
        },
        {
          service_id: service2Id,
          type: '7-seater',
          capacity: 7,
          description: 'Service 2 vehicle'
        }
      ])
      .execute();

    // Create routes for both services
    await db.insert(routesTable)
      .values([
        {
          service_id: service1Id,
          pickup_location: 'Location A',
          destination: 'Destination A',
          price: '20.00'
        },
        {
          service_id: service2Id,
          pickup_location: 'Location B',
          destination: 'Destination B',
          price: '30.00'
        }
      ])
      .execute();

    const result = await getServiceDetails(service1Id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(service1Id);
    expect(result!.name).toEqual('Service 1');

    // Should only have Service 1's vehicle and route
    expect(result!.vehicles).toHaveLength(1);
    expect(result!.vehicles[0].description).toEqual('Service 1 vehicle');
    expect(result!.vehicles[0].service_id).toEqual(service1Id);

    expect(result!.routes).toHaveLength(1);
    expect(result!.routes[0].pickup_location).toEqual('Location A');
    expect(result!.routes[0].service_id).toEqual(service1Id);
  });
});
