// src/services/locationService.ts

import redis from '../utils/redisClient'

type Location = {
    lat: number
    lng: number
    updatedAt: number
}

const LOCATION_KEY_PREFIX = 'user:location:'

export async function updateLocation(userId: string, lat: number, lng: number): Promise<void> {
    if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId')
    }

    // ✅ Validate coordinates
    if (
        typeof lat !== 'number' || Number.isNaN(lat) || lat < -90 || lat > 90 ||
        typeof lng !== 'number' || Number.isNaN(lng) || lng < -180 || lng > 180
    ) {
        throw new Error(`Invalid location: lat=${lat}, lng=${lng}`)
    }

    const key = `${LOCATION_KEY_PREFIX}${userId}`
    const location: Location = {
        lat,
        lng,
        updatedAt: Date.now(),
    }

    try {
        await redis.set(key, JSON.stringify(location))
    } catch (err) {
        console.error('❌ Redis write error:', err)
        throw new Error('Failed to update location')
    }
}

export async function getLocation(userId: string): Promise<Location | null> {
    const key = `${LOCATION_KEY_PREFIX}${userId}`

    try {
        const result = await redis.get(key)
        if (!result) return null

        const parsed = JSON.parse(result) as Location

        // ✅ Optional: sanity check returned data
        if (
            typeof parsed.lat !== 'number' ||
            typeof parsed.lng !== 'number' ||
            typeof parsed.updatedAt !== 'number'
        ) {
            throw new Error('Corrupted location data in Redis')
        }

        return parsed
    } catch (err) {
        console.error(`❌ Redis read/parse error for userId=${userId}:`, err)
        return null
    }
}
