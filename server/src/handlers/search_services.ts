
import { db } from '../db';
import { carServicesTable, routesTable, vehiclesTable } from '../db/schema';
import { type SearchServicesInput, type CarService } from '../schema';
import { eq, and, gte, SQL } from 'drizzle-orm';

export async function searchServices(input: SearchServicesInput): Promise<CarService[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Always filter for active services
    conditions.push(eq(carServicesTable.is_active, true));

    // Check if we need joins
    const needsRouteJoin = input.pickup_location || input.destination;
    const needsVehicleJoin = input.vehicle_type || input.passenger_count;

    // Build the query based on what joins we need
    if (needsRouteJoin && needsVehicleJoin) {
      // Join with both routes and vehicles
      if (input.pickup_location) {
        conditions.push(eq(routesTable.pickup_location, input.pickup_location));
      }
      if (input.destination) {
        conditions.push(eq(routesTable.destination, input.destination));
      }
      if (input.vehicle_type) {
        conditions.push(eq(vehiclesTable.type, input.vehicle_type));
      }
      if (input.passenger_count) {
        conditions.push(gte(vehiclesTable.capacity, input.passenger_count));
      }

      // Add join conditions to main conditions
      conditions.push(eq(routesTable.service_id, carServicesTable.id));
      conditions.push(eq(routesTable.is_active, true));
      conditions.push(eq(vehiclesTable.service_id, carServicesTable.id));
      conditions.push(eq(vehiclesTable.is_available, true));

      const results = await db.select({
        id: carServicesTable.id,
        name: carServicesTable.name,
        phone: carServicesTable.phone,
        description: carServicesTable.description,
        is_active: carServicesTable.is_active,
        created_at: carServicesTable.created_at,
      })
      .from(carServicesTable)
      .innerJoin(routesTable, eq(routesTable.service_id, carServicesTable.id))
      .innerJoin(vehiclesTable, eq(vehiclesTable.service_id, carServicesTable.id))
      .where(and(...conditions))
      .execute();

      // Remove duplicates and return unique services
      const uniqueServices = new Map<number, CarService>();
      results.forEach(result => {
        if (!uniqueServices.has(result.id)) {
          uniqueServices.set(result.id, result);
        }
      });
      return Array.from(uniqueServices.values());

    } else if (needsRouteJoin) {
      // Join only with routes
      if (input.pickup_location) {
        conditions.push(eq(routesTable.pickup_location, input.pickup_location));
      }
      if (input.destination) {
        conditions.push(eq(routesTable.destination, input.destination));
      }

      conditions.push(eq(routesTable.service_id, carServicesTable.id));
      conditions.push(eq(routesTable.is_active, true));

      const results = await db.select({
        id: carServicesTable.id,
        name: carServicesTable.name,
        phone: carServicesTable.phone,
        description: carServicesTable.description,
        is_active: carServicesTable.is_active,
        created_at: carServicesTable.created_at,
      })
      .from(carServicesTable)
      .innerJoin(routesTable, eq(routesTable.service_id, carServicesTable.id))
      .where(and(...conditions))
      .execute();

      // Remove duplicates and return unique services
      const uniqueServices = new Map<number, CarService>();
      results.forEach(result => {
        if (!uniqueServices.has(result.id)) {
          uniqueServices.set(result.id, result);
        }
      });
      return Array.from(uniqueServices.values());

    } else if (needsVehicleJoin) {
      // Join only with vehicles
      if (input.vehicle_type) {
        conditions.push(eq(vehiclesTable.type, input.vehicle_type));
      }
      if (input.passenger_count) {
        conditions.push(gte(vehiclesTable.capacity, input.passenger_count));
      }

      conditions.push(eq(vehiclesTable.service_id, carServicesTable.id));
      conditions.push(eq(vehiclesTable.is_available, true));

      const results = await db.select({
        id: carServicesTable.id,
        name: carServicesTable.name,
        phone: carServicesTable.phone,
        description: carServicesTable.description,
        is_active: carServicesTable.is_active,
        created_at: carServicesTable.created_at,
      })
      .from(carServicesTable)
      .innerJoin(vehiclesTable, eq(vehiclesTable.service_id, carServicesTable.id))
      .where(and(...conditions))
      .execute();

      // Remove duplicates and return unique services
      const uniqueServices = new Map<number, CarService>();
      results.forEach(result => {
        if (!uniqueServices.has(result.id)) {
          uniqueServices.set(result.id, result);
        }
      });
      return Array.from(uniqueServices.values());

    } else {
      // No joins needed - just query car services directly
      const results = await db.select({
        id: carServicesTable.id,
        name: carServicesTable.name,
        phone: carServicesTable.phone,
        description: carServicesTable.description,
        is_active: carServicesTable.is_active,
        created_at: carServicesTable.created_at,
      })
      .from(carServicesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

      return results;
    }
  } catch (error) {
    console.error('Service search failed:', error);
    throw error;
  }
}
