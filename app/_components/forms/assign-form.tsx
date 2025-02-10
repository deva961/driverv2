"use client";

import { Calendar } from "@/components/ui/calendar";

import { DriverData, getDrivers } from "@/actions/driver-action";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { assignmentSchema } from "@/schema/assignment-schema";
import { createAssignment } from "@/actions/assignment-action";
import toast from "react-hot-toast";
import { Status } from "@prisma/client";

export const AssignForm = () => {
  const [drivers, setDrivers] = useState<DriverData[]>([]);

  useEffect(() => {
    const fetchDrivers = async () => {
      const res = await getDrivers();
      if (res.data && res.status === 200) {
        setDrivers(res.data);
      }
    };

    fetchDrivers();
  }, []);

  const form = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      carPlate: "",
      pickupDate: new Date(),
      driverId: "",
      status: Status.ASSIGNED,
    },
  });

  const { isSubmitting, errors } = form.formState;
  console.log(errors);

  const onSubmit = async (values: z.infer<typeof assignmentSchema>) => {
    try {
      const res = await createAssignment(values);

      if (res?.status === 200) {
        toast.success("Assignment created successfully!");
        form.reset();
      } else {
        toast.error(res?.message || "Failed to create assignment!");
      }
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast.error("Something went wrong while submitting the assignment.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Car Plate Field */}
        <FormField
          control={form.control}
          name="carPlate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Car Plate</FormLabel>
              <FormControl>
                <Input placeholder="TS21G9732" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pickupDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Pickup Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date.getTime() < new Date().setHours(0, 0, 0, 0)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="driverId"
          render={({ field }) => (
            <FormItem className="flex flex-col w-full">
              <FormLabel>Driver</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.length === 0 && (
                      <SelectItem value="none" disabled>
                        No Drivers
                      </SelectItem>
                    )}
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
};
