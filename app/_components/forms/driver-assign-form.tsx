"use client";

import { updateAssignment } from "@/actions/assignment-action";
import { Spinner } from "@/components/spinner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGeolocation } from "@/hooks/use-geo-location";
import { assignmentSchema } from "@/schema/assignment-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Status } from "@prisma/client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

export const DriverAssignForm = ({
  carPlate,
  id,
  driverId,
  pickupDate,
}: {
  id: string;
  driverId: string;
  carPlate: string;
  pickupDate: Date;
}) => {
  const form = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      carPlate: carPlate,
      driverId: driverId,
      pickupDate: pickupDate,
      status: "ASSIGNED",
      startAddress: "",
      transportType: "",
      images: [""],
      type: "",
    },
  });

  const { address } = useGeolocation();

  const formType = form.watch("type");
  useEffect(() => {
    if (address) {
      form.setValue("startAddress", address);
    }
  }, [address, form]);

  const { isSubmitting, errors } = form.formState;
  console.log(errors);
  // Handle form submission
  async function onSubmit(values: z.infer<typeof assignmentSchema>) {
    try {
      const res = await updateAssignment(id, driverId, {
        ...values,
        status: Status.PENDING,
        startAddress: values.startAddress,
      });

      if (res.status === 200) {
        toast.success("Assignment updated successfully!");
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong!");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Car Plate Input */}
        <Input placeholder={carPlate} disabled />

        {/* Task Type Dropdown */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Type</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PICKUP">Pick up</SelectItem>
                    <SelectItem value="DROPOFF">Drop off</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional Input Field for PICKUP Task */}
        {formType === "PICKUP" && (
          <FormField
            control={form.control}
            name="transportType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transportation Type</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Transportation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="bike">Bike</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="metro">Metro</SelectItem>
                      <SelectItem value="train">Train</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : "Continue"}
        </Button>
      </form>
    </Form>
  );
};
