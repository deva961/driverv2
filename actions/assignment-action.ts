"use server";

import { db } from "@/lib/db";
import { assignmentSchema } from "@/schema/assignment-schema";
import { Role, Status } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const getAssignments = async () => {
  try {
    const assignments = await db.assignment.findMany({
      include: {
        driver: {
          include: {
            user: true,
          },
        },
        manager: true,
      },
    });

    return {
      data: assignments,
      message: "success",
      status: 200,
    };
  } catch (error) {
    console.log(error);
    return {
      data: [],
      message: "Failed to fetch assignment!",
      status: 500,
    };
  }
};

// getAssignments function
export const getAssignmentsForDriver = async (
  driverId: string,
  role: string
) => {
  try {
    let assignments;

    if (role === Role.ADMIN) {
      assignments = await db.assignment.findMany({
        include: {
          driver: {
            include: {
              user: true,
            },
          },
          manager: true,
        },
      });
    } else if (role === Role.DRIVER) {
      assignments = await db.assignment.findMany({
        where: {
          driverId,
          status: { not: Status.COMPLETED },
        },
        include: {
          driver: {
            include: {
              user: true,
            },
          },
          manager: true,
        },
      });
    }

    return {
      data: assignments,
      message: "success",
      status: 200,
    };
  } catch (error) {
    console.log(error);
    return {
      data: [],
      message: "Failed to fetch assignment!",
      status: 500,
    };
  }
};

export const createAssignment = async (
  values: z.infer<typeof assignmentSchema>
) => {
  // Validate the fields using the schema
  const validatedFields = assignmentSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      data: [],
      message: "Please fill all the fields correctly!",
      status: 400,
    };
  }

  const { driverId, carPlate, pickupDate, status } = validatedFields.data;

  try {
    // Check if a driver already has an active assignment
    const existingAssignment = await db.assignment.findFirst({
      where: { driverId },
    });

    if (existingAssignment && existingAssignment.status !== Status.COMPLETED) {
      return {
        data: [],
        message: "Driver already has an active assignment!",
        status: 400,
      };
    }

    const newAssignment = await db.assignment.create({
      data: {
        driverId,
        carPlate,
        pickupDate,
        status,
      },
    });

    return {
      status: 200,
      message: "Assignment created successfully",
      data: newAssignment,
    };
  } catch (error) {
    console.error("Error creating assignment:", error);

    return {
      data: [],
      message: "Failed to create assignment due to an internal error.",
      status: 500,
    };
  }
};

export const updateAssignment = async (
  id: string,
  driverId: string,
  values: z.infer<typeof assignmentSchema>
) => {
  // Validate the fields using the schema
  const validatedFields = assignmentSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      data: [],
      message: "Please fill all the fields correctly!",
      status: 400,
    };
  }

  try {
    const updatedAssignment = await db.assignment.update({
      where: { id, driverId },
      data: {
        transportationType: values.transportType,
        type: values.type,
        images: values.images,
        startAdress: values.startAddress,
        pickupAddress: values.pickupAddress,
        dropOffAddress: values.dropOffAddress,
        status: values.status,
        finalImage: values.finalImage,
      },
    });

    revalidatePath(`/records/driver/${id}`);

    return {
      status: 200,
      message: "Assignment updated successfully",
      data: updatedAssignment,
    };
  } catch (error) {
    console.error("Error updating assignment:", error);

    return {
      data: [],
      message: "Failed to update assignment due to an internal error.",
      status: 500,
    };
  }
};
