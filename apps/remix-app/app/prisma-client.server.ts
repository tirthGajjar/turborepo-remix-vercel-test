import { PrismaClient } from "@prisma/client";

let db: PrismaClient;

declare global {
  var __db: PrismaClient | undefined;
}

const logThreshold = process.env.NODE_ENV === "development" ? 500 : 50;

function getClient(): PrismaClient {
  console.log(`Setting up prisma client`);
  // NOTE: during development if you change anything in this function, remember
  // that this only runs once per server restart and won't automatically be
  // re-run per request like everything else is.
  const client = new PrismaClient({
    log: [
      { level: "query", emit: "event" },
      { level: "error", emit: "stdout" },
      { level: "info", emit: "stdout" },
      { level: "warn", emit: "stdout" },
    ],
  });
  client.$on("query", (e: { duration: number; query: any }) => {
    if (e.duration < logThreshold) return;

    console.log(`prisma:query - ${e.query}`);
  });
  // make the connection eagerly so the first request doesn't have to wait
  void client.$connect();
  return client;
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
if (process.env.NODE_ENV === "production") {
  db = getClient();
  db.$connect();
} else {
  if (!global.__db) {
    global.__db = getClient();
    global.__db.$connect();
  }
  db = global.__db;
}

export { db };
