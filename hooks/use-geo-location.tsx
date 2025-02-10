import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface LocationProps {
  latitude: number;
  longitude: number;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationProps | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLocation({ latitude: lat, longitude: lon });
        },
        (err) => {
          console.log(err);
          setError("Failed to retrieve geolocation.");
          toast.error("Failed to retrieve geolocation.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      toast.error("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    if (location) {
      const fetchAddress = async () => {
        const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;

        if (!apiKey) {
          setError("OpenCage API key is missing");
          toast.error("OpenCage API key is missing");
          return;
        }

        try {
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${location.latitude},${location.longitude}&key=${apiKey}`
          );

          if (!response.ok) {
            setError("Failed to fetch location data");
            toast.error("Failed to fetch location data");
            return;
          }

          const data = await response.json();
          const fetchedAddress =
            data.results[0]?.formatted || "Address not found";
          setAddress(fetchedAddress);
        } catch (err) {
          console.log(err);
          setError("Error fetching address");
          toast.error("Error fetching address");
        }
      };

      fetchAddress();
    }
  }, [location]);

  return { address, error };
};
