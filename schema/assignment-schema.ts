import { Status } from "@prisma/client";
import { z } from "zod";

export const assignmentSchema = z.object({
  carPlate: z.string().min(2, {
    message: "Plate must be at least 2 characters.",
  }),
  driverId: z.string().min(2, {
    message: "Please choose driver",
  }),
  pickupAddress: z.string().optional(),
  dropOffAddress: z.string().optional(),
  pickupDate: z.date(),
  status: z.enum([Status.ASSIGNED, Status.PENDING, Status.COMPLETED]),
  transportType: z.string().optional(),
  images: z.array(z.string()).optional(),
  type: z.string().optional(),
  finalImage: z.string().optional(),
});
