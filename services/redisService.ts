import redis from "redis";
const geohash = require("ngeohash");

function getGeohash(
  latitude: number,
  longitude: number,
  precision: number = 5
): string {
  return geohash.encode(latitude, longitude, precision);
}

const redisClient = redis.createClient();

export function updateDriverLocation(
  driverId: string,
  latitude: number,
  longitude: number
) {
  // Key to store driver locations

  const precision = 5; // Adjust precision as needed
  const hash = getGeohash(latitude, longitude, precision);
  const key = `drivers:${hash}`;

  redisClient
    .sAdd(key, driverId)
    .then(() => {
      console.log(`Driver ${driverId} added to geohash ${hash}`);
    })
    .catch((err: Error) => {
      console.error("Error adding driver to geohash set:", err);
    });
  // Optionally, set an expiration time to remove inactive drivers
  // (Not directly supported for GEO sets, but can be managed separately)
}

async function findNearbyDrivers(
  latitude: number,
  longitude: number
): Promise<string[]> {
  const precision = 5; // Same precision used when storing driver locations
  const riderHash = getGeohash(latitude, longitude, precision);

  // Get neighboring geohashes
  const neighbors = geohash.neighbors(riderHash);
  const geohashesToSearch = [riderHash, ...neighbors];

  const driversSet = new Set<string>();

  for (const hash of geohashesToSearch) {
    const key = `drivers:${hash}`;
    try {
      const driverIds = await redisClient.sMembers(key);
      driverIds.forEach((id) => driversSet.add(id));
    } catch (err) {
      console.error("Error fetching drivers from Redis:", err);
    }
  }

  return Array.from(driversSet);
}
