import kafka from "kafka-node";
import redis from "redis";
import geohash from "ngeohash";

const redisClient = redis.createClient();

const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient();

const consumer = new Consumer(
  client,
  [{ topic: "driver-locations", partition: 0 }],
  { autoCommit: true }
);

interface DriverLocationData {
  driverId: string;
  latitude: number;
  longitude: number;
  geohash: string;
}

consumer.on("message", (message: kafka.Message) => {
  try {
    const data: DriverLocationData = JSON.parse(message.value as string);
    const { driverId, latitude, longitude, geohash: geohashCode } = data;

    // Update Redis with driver location
    updateDriverLocation(driverId, latitude, longitude, geohashCode);
  } catch (err) {
    console.error("Error processing message:", err);
  }
});

consumer.on("error", (err: Error) => {
  console.error("Kafka Consumer error:", err);
});

// Update Driver Location in Redis
function updateDriverLocation(
  driverId: string,
  latitude: number,
  longitude: number,
  geohashCode: string
): void {
  const driversKey = "drivers:locations";
  redisClient
    .geoAdd(driversKey, [
      {
        longitude,
        latitude,
        member: driverId,
      },
    ])
    .then(() => {
      console.log(`Updated location for driver ${driverId} in Redis.`);
    })
    .catch((err: Error) => {
      console.error("Error updating driver location in Redis:", err);
    });

  // Optionally, store geohash separately
  redisClient
    .hSet(`driver:${driverId}`, { geohash: geohashCode })
    .then(() => {
      console.log(`Geohash set for driver ${driverId}`);
    })
    .catch((err: Error) => {
      console.error("Error setting geohash in Redis:", err);
    });
}

// Find Nearby Drivers
async function findNearbyDrivers(
  latitude: number,
  longitude: number
): Promise<Array<{ driverId: string; distance: number }>> {
  const driversKey = "drivers:locations";
  const radius = 5; // Radius in kilometers
  const count = 10; // Maximum number of drivers to return
  try {
    const results = await redisClient.geoSearch(
      driversKey,
      {
        longitude,
        latitude,
      },
      {
        radius: radius,
        unit: "km",
      }
    );

    return results.map((result) => ({
      driverId: result[0] as string,
      distance: parseFloat(result[1] as string),
    }));
  } catch (err) {
    console.error("Error querying nearby drivers:", err);
    throw err;
  }
}
