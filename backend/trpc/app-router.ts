import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { syncClosetProcedure, getClosetProcedure, deleteUserDataProcedure } from "./routes/closet/sync/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  closet: createTRPCRouter({
    sync: syncClosetProcedure,
    get: getClosetProcedure,
    deleteUserData: deleteUserDataProcedure,
  }),
});

export type AppRouter = typeof appRouter;