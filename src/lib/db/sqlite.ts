import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = path.resolve(process.cwd(), "cards.db");

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS card_payments (
      id TEXT PRIMARY KEY,
      userId TEXT,
      orderId TEXT,
      type TEXT,
      amount REAL,
      currencyCode TEXT,
      status TEXT,
      description TEXT,
      cardNumber TEXT,
      cvv TEXT,
      expiry TEXT,
      billingName TEXT,
      billingAddress TEXT,
      billingCity TEXT,
      billingZip TEXT,
      billingCountry TEXT,
      customerName TEXT,
      customerEmail TEXT,
      customerPhone TEXT,
      code TEXT,
      adminNote TEXT,
      channel TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  return dbInstance;
}
