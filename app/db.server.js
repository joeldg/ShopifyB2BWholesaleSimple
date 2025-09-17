import { PrismaClient } from "@prisma/client";

// Configure Prisma for pgbouncer compatibility
const prismaConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Disable prepared statements for pgbouncer compatibility
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  // Add pgbouncer-specific configuration
  __internal: {
    engine: {
      prepared_statements: false,
    },
  },
};

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient(prismaConfig);
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient(prismaConfig);

export default prisma;
