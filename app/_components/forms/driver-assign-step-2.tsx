"use client";

import { updateAssignment } from "@/actions/assignment-action";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useGeolocation } from "@/hooks/use-geo-location";

import { zodResolver } from "@hookform/resolvers/zod";
import { Status } from "@prisma/client";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

export const driverAssignmentSchema = z.object({
  carPlate: z.string().min(2, {
    message: "Plate must be at least 2 characters.",
  }),
  driverId: z.string().min(2, {
    message: "Please choose driver",
  }),
  startAddress: z.string().optional(),
  pickupAddress: z.string().optional(),
  dropOffAddress: z.string().optional(),
  pickupDate: z.date(),
  status: z.enum([
    Status.ASSIGNED,
    Status.PENDING,
    Status.PICKED,
    Status.COMPLETED,
  ]),
  transportType: z.string().optional(),
  images: z.array(z.string()).length(5, "You must provide exactly 5 images."),
  type: z.string().optional(),
  finalImage: z.string().optional(),
});

export const DriverAssignFormStep2 = ({
  carPlate,
  id,
  driverId,
  pickupDate,
}: {
  carPlate: string;
  id: string;
  driverId: string;
  pickupDate: Date;
}) => {
  const [images, setImages] = useState<string[]>([]);
  const form = useForm<z.infer<typeof driverAssignmentSchema>>({
    resolver: zodResolver(driverAssignmentSchema),
    defaultValues: {
      carPlate,
      pickupDate,
      driverId,
      pickupAddress: "",
      images: [],
      status: Status.PICKED,
    },
  });

  const { address } = useGeolocation();

  useEffect(() => {
    if (address) {
      form.setValue("pickupAddress", address);
    }
  }, [address, form]);

  const { isSubmitting } = form.formState;

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.log("Error while compressing the image", error);
      throw error;
    }
  };

  // Handle file input change
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file);
        const imageUrl = URL.createObjectURL(compressedImage);

        // Update the images state
        const newImages = [...images];
        newImages[index] = imageUrl;
        setImages(newImages);

        // Update the form value
        form.setValue("images", newImages);
      } catch (error) {
        console.log("Error while handling image change", error);
      }
    }
  };

  const { errors } = form.formState;

  console.log(errors);

  // Handle form submission
  async function onSubmit(values: z.infer<typeof driverAssignmentSchema>) {
    try {
      console.log(values);
      const res = await updateAssignment(id, driverId, values);
      if (res.status === 200) {
        toast.success("Assignment saved successfully!");
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
        <div>
          <label
            htmlFor="cover-photo"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Car Number
          </label>
          <Input placeholder={carPlate} disabled />
        </div>
        <div className="col-span-1">
          <label
            htmlFor="cover-photo"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Cover photo (కార్ ఫోటోను అప్‌లోడ్ చేయండి)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {["front", "left", "back", "right", "odometer"].map(
              (view, index) => (
                <div
                  key={view}
                  className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10"
                >
                  <div className="text-center">
                    <Image
                      loading="lazy"
                      src={`/${view}_view.webp`}
                      height={120}
                      width={120}
                      className="mx-auto"
                      alt={`${view} view`}
                    />
                    <div className="mt-4 text-sm/6 text-gray-600">
                      <label
                        htmlFor={`file-upload-${index}`}
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:outline-hidden hover:text-indigo-500"
                      >
                        <span>
                          Upload {view.charAt(0).toUpperCase() + view.slice(1)}{" "}
                          photo
                        </span>
                        <input
                          id={`file-upload-${index}`}
                          name={`file-upload-${index}`}
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleFileChange(e, index)}
                        />
                      </label>
                      <p className="pl-1">{`${
                        view.charAt(0).toUpperCase() + view.slice(1)
                      } ఫోటోను అప్‌లోడ్ చేయండి`}</p>
                    </div>
                    {/* Image Preview */}
                    {images[index] && (
                      <div className="relative h-40 w-full ">
                        <Image
                          fill
                          src={images[index]}
                          className="mx-auto object-contain"
                          alt={`${view} preview`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : "Save"}
        </Button>
      </form>
    </Form>
  );
};
