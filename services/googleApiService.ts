import axios, { AxiosResponse } from "axios";

const kGoogleApiKey = "AIzaSyCdXyAkWjkhUlWXBbpkieWRi2OV47AbVFE";

interface Route {
  duration: string;
  distanceMeters: number;
  travelAdvisory?: {
    tollInfo?: {
      estimatedPrice?: [
        {
          currencyCode: string;
          units: number;
        }
      ];
    };
  };
}

interface DirectionsResponse {
  routes: Route[];
}

interface Prediction {
    description: string;
    place_id: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
}

export async function getDirectionsWithTolls(
  pickupLat: number,
  pickupLong: number,
  dropLat: number,
  dropLong: number
): Promise<{
  duration?: string;
  distance?: number;
  tollCost?: number;
  currency?: string;
  error?: string;
}> {
  try {
    const response: AxiosResponse<DirectionsResponse> = await axios.post(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        origin: {
          location: {
            latLng: {
              latitude: pickupLat,
              longitude: pickupLong,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: dropLat,
              longitude: dropLong,
            },
          },
        },
        travelMode: "DRIVE",
        extraComputations: ["TOLLS"],
        routeModifiers: {
          vehicleInfo: {
            emissionType: "GASOLINE",
          },
          tollPasses: ["IN_FASTAG"],
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": kGoogleApiKey,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo",
        },
      }
    );

    if (response.status === 200) {
      const data = response.data;
      console.log(data);
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const tollInfo = route.travelAdvisory?.tollInfo || {};
        const estimatedPrice = tollInfo.estimatedPrice;

        const tollCost =
          estimatedPrice && estimatedPrice.length > 0
            ? estimatedPrice[0].units
            : 0;
        const currency =
          estimatedPrice && estimatedPrice.length > 0
            ? estimatedPrice[0].currencyCode
            : "INR";

        return {
          duration: route.duration,
          distance: route.distanceMeters,
          tollCost,
          currency,
        };
      } else {
        return { error: "No route found" };
      }
    } else {
      throw new Error(
        `Failed to load directions. Status code: ${response.status}`
      );
    }
  } catch (error) {
    console.error(`Error getting directions with tolls: ${error}`);
    return { error: "Error fetching data" };
  }
}

export async function getAutoCompleteSuggestions(input: string): Promise<Array<{description: string, placeId: string}>> {
  if (!input) {
      throw new Error('query is required');
  }
  console.log("input function ", input);

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:in&types=establishment&location=28.6139,77.2090&radius=50000&strictbounds=true&key=${kGoogleApiKey}`;

  try {
      const response = await axios.get(url);
      if (response.data.status === 'OK') {
          console.log("response.data.predictions", response.data.predictions);
          return response.data.predictions.map((prediction: Prediction) => ({
              description: prediction.description,
              placeId: prediction.place_id
          })).filter((value: {description: string, placeId: string}) => value.description && value.placeId);
      } else {
          console.log("response.data.status", response.data.status);
        throw new Error('Unable to fetch suggestions');
      }
  } catch (err) {
      console.log("err", err);
      console.error(err);
      throw err;
  }
}

export async function getDistanceAndETA(origin: string, destination: string): Promise<any> {
  try {
    // Build the URL for the Distance Matrix API request
    const url = `https://routes.googleapis.com/distanceMatrix/v2/matrix?key=${kGoogleApiKey}`;

    const requestBody = {
      origins: [{ address: origin }],
      destinations: [{ address: destination }],
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false,
      departureTime: new Date().toISOString(),
      units: "METRIC"
    };

    const response = await axios.post(url, requestBody);

    if (response.data && response.data.rows && response.data.rows[0].elements) {
      const element = response.data.rows[0].elements[0];

      // Calculate estimated price (base rate + per km rate)
      const baseRates = [50, 100, 150];
      const perKmRates = [12, 15, 18];
      const distanceInKm = element.distanceMeters / 1000;
      const estimatedPrice = baseRates[0] + (distanceInKm * perKmRates[0]);

      return {
        distance: {
          meters: element.distanceMeters,
          text: `${(element.distanceMeters / 1000).toFixed(1)} km`
        },
        duration: {
          seconds: element.duration,
          text: `${(element.duration / 3600).toFixed(1)} hours`
        },
        estimatedPrice: {
          amount: Math.round(estimatedPrice),
          currency: "INR"
        }
      };
    } else {
      throw new Error("Invalid response from Distance Matrix API");
    }
  } catch (error) {
    console.error("Error calculating distance and ETA:", error);
    throw error;
  }
}
