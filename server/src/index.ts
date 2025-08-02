
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  searchServicesInputSchema,
  createCarServiceInputSchema,
  createVehicleInputSchema,
  createRouteInputSchema,
  createBookingInputSchema,
  updateBookingStatusInputSchema
} from './schema';

// Import handlers
import { searchServices } from './handlers/search_services';
import { getCarServices } from './handlers/get_car_services';
import { createCarService } from './handlers/create_car_service';
import { createVehicle } from './handlers/create_vehicle';
import { createRoute } from './handlers/create_route';
import { createBooking } from './handlers/create_booking';
import { getServiceDetails } from './handlers/get_service_details';
import { updateBookingStatus } from './handlers/update_booking_status';
import { getBookings } from './handlers/get_bookings';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Search services based on criteria
  searchServices: publicProcedure
    .input(searchServicesInputSchema)
    .query(({ input }) => searchServices(input)),

  // Get all car services
  getCarServices: publicProcedure
    .query(() => getCarServices()),

  // Get detailed information about a specific service
  getServiceDetails: publicProcedure
    .input(z.object({ serviceId: z.number() }))
    .query(({ input }) => getServiceDetails(input.serviceId)),

  // Create new car service
  createCarService: publicProcedure
    .input(createCarServiceInputSchema)
    .mutation(({ input }) => createCarService(input)),

  // Create new vehicle for a service
  createVehicle: publicProcedure
    .input(createVehicleInputSchema)
    .mutation(({ input }) => createVehicle(input)),

  // Create new route for a service
  createRoute: publicProcedure
    .input(createRouteInputSchema)
    .mutation(({ input }) => createRoute(input)),

  // Create new booking
  createBooking: publicProcedure
    .input(createBookingInputSchema)
    .mutation(({ input }) => createBooking(input)),

  // Update booking status
  updateBookingStatus: publicProcedure
    .input(updateBookingStatusInputSchema)
    .mutation(({ input }) => updateBookingStatus(input)),

  // Get bookings (optionally filtered by service)
  getBookings: publicProcedure
    .input(z.object({ serviceId: z.number().optional() }).optional())
    .query(({ input }) => getBookings(input?.serviceId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
