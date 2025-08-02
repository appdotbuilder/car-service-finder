
import { db } from '../db';
import { carServicesTable, vehiclesTable, routesTable } from '../db/schema';
import { type CarService, type Vehicle, type Route } from '../schema';
import { eq } from 'drizzle-orm';

export type ServiceDetails = CarService & {
  vehicles: Vehicle[];
  routes: Route[];
};

export async function getServiceDetails(serviceId: number): Promise<ServiceDetails | null> {
  try {
    // First, get the service
    const serviceResult = await db.select()
      .from(carServicesTable)
      .where(eq(carServicesTable.id, serviceId))
      .execute();

    if (serviceResult.length === 0) {
      return null;
    }

    const service = serviceResult[0];

    // Get all vehicles for this service
    const vehiclesResult = await db.select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.service_id, serviceId))
      .execute();

    // Get all routes for this service
    const routesResult = await db.select()
      .from(routesTable)
      .where(eq(routesTable.service_id, serviceId))
      .execute();

    // Convert numeric fields for routes
    const routes = routesResult.map(route => ({
      ...route,
      price: parseFloat(route.price) // Convert numeric to number
    }));

    return {
      ...service,
      vehicles: vehiclesResult,
      routes: routes
    };
  } catch (error) {
    console.error('Service details fetch failed:', error);
    throw error;
  }
}
