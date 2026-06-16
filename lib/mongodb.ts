import mongoose from "mongoose"

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalWithMongoose = global as typeof globalThis & {
  mongooseCache?: MongooseCache
}

let cached: MongooseCache = globalWithMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
}

if (!globalWithMongoose.mongooseCache) {
  globalWithMongoose.mongooseCache = cached
}

export async function connectDB() {
  if (cached.conn) return cached.conn

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/swrk-crm"
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable")
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri)
  }

  cached.conn = await cached.promise
  return cached.conn
}
