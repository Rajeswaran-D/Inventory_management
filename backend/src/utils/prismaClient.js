const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

/**
 * 🛠️ DB PATH RESOLUTION
 * Prisma by default creates the SQLite file relative to the schema file 
 * or based on the DATABASE_URL in the .env file.
 */
let dbPath;

try {
  const electron = require('electron');
  const app = electron.app || (electron.remote && electron.remote.app);
  if (app && app.getPath) {
    dbPath = path.join(app.getPath('userData'), 'database.sqlite');
  }
} catch (e) {}

if (!dbPath) {
  // Check common locations
  const rootDb = path.join(process.cwd(), 'dev.db');
  const prismaDb = path.join(process.cwd(), 'prisma', 'dev.db');
  
  if (fs.existsSync(prismaDb)) {
    dbPath = prismaDb;
  } else {
    dbPath = rootDb;
  }
}

// Ensure directory exists if we are creating a new one
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

console.log("📍 Verified DB Path for Backend:", dbPath);

/**
 * 🚀 PRISMA CLIENT INITIALIZATION
 */
const globalForPrisma = global;
let basePrisma = globalForPrisma.prisma;

if (!basePrisma) {
  basePrisma = new PrismaClient({
    datasourceUrl: `file:${dbPath}`
  });
  
  if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = basePrisma;
  }
}

const prisma = basePrisma.$extends({
  result: {
    $allModels: {
      _id: {
        needs: { id: true },
        compute(item) {
          return item.id;
        },
      }
    },
  },
});

module.exports = prisma;
