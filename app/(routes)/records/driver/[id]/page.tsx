import { DriverAssignForm } from "@/app/_components/forms/driver-assign-form";
import { DriverAssignFormStep3 } from "@/app/_components/forms/driver-assign-form-3";
import { DriverAssignFormStep2 } from "@/app/_components/forms/driver-assign-step-2";
import { db } from "@/lib/db";

const page = async ({ params }: { params: { id: string } }) => {
  const data = await db.assignment.findUnique({
    where: {
      id: params.id,
    },
  });
  if (!data) {
    return <>No Data found</>;
  }

  if (data.status === "ASSIGNED") {
    return (
      <DriverAssignForm
        driverId={data.driverId}
        id={data.id}
        carPlate={data.carPlate}
        pickupDate={data.pickupDate}
      />
    );
  }

  if (data.status === "PENDING") {
    return (
      <DriverAssignFormStep2
        driverId={data.driverId}
        id={data.id}
        carPlate={data.carPlate}
        pickupDate={data.pickupDate}
      />
    );
  }

  if (data.status === "PICKED") {
    return (
      <DriverAssignFormStep3
        driverId={data.driverId}
        id={data.id}
        carPlate={data.carPlate}
        pickupDate={data.pickupDate}
      />
    );
  }

  return null;
};

export default page;
