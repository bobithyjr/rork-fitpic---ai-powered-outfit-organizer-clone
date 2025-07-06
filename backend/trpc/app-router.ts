import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { syncClosetProcedure, getClosetProcedure, deleteUserDataProcedure } from "./routes/closet/sync/route";
import { uploadImageProcedure, getImageProcedure, deleteImageProcedure } from "./routes/closet/images/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  closet: createTRPCRouter({
    sync: syncClosetProcedure,
    get: getClosetProcedure,
    deleteUserData: deleteUserDataProcedure,
    uploadImage: uploadImageProcedure,
    getImage: getImageProcedure,
    deleteImage: deleteImageProcedure,
  }),
});

export type AppRouter = typeof appRouter;