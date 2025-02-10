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
import { assignmentSchema } from "@/schema/assignment-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Status } from "@prisma/client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { DriverAssignFormStep2 } from "./driver-assign-step-2";

interface LocationProps {
  latitude: number;
  longitude: number;
}

export const DriverAssignForm = ({
  carPlate,
  status,
  id,
  driverId,
  pickupDate,
}: {
  id: string;
  driverId: string;
  carPlate: string;
  status: Status;
  pickupDate: Date;
}) => {
  const form = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      carPlate: carPlate,
      driverId: driverId,
      status: status,
      pickupDate: pickupDate,
      pickupAddress: "",
      dropOffAddress: "",
      transportType: "",
      images: [""],
      finalImage: "",
      type: "",
    },
  });

  const formType = form.watch("type");

  const { isSubmitting } = form.formState;

  const [location, setLocation] = useState<LocationProps | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Geolocation logic
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLocation({ latitude: lat, longitude: lon });
      });
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    if (location) {
      try {
        const fetchAddress = async () => {
          const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;

          // Check if the API key is available
          if (!apiKey) {
            setError("OpenCage API key is missing");
            return;
          }

          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${location.latitude},${location.longitude}&key=${apiKey}`
          );

          if (!response.ok) {
            setError("Failed to fetch location data");
            return;
          }

          const data = await response.json();
          const address = data.results[0]?.formatted || "Address not found";
          form.setValue("pickupAddress", address);
        };
        fetchAddress();
      } catch (error) {
        console.log(error);
      }
    }
  }, [location, form]);

  if (error) {
    toast.error(error);
  }

  // Handle form submission
  async function onSubmit(values: z.infer<typeof assignmentSchema>) {
    try {
      const res = await updateAssignment(id, driverId, {
        ...values,
        status: Status.PENDING,
        pickupAddress: values.pickupAddress,
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

  return status === Status.ASSIGNED ? (
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
  ) : (
    <DriverAssignFormStep2 carPlate={carPlate} />
  );
};
