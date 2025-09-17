import { SessionStorage } from "@shopify/shopify-app-session-storage";
import pool from "./db.server";

export class PgSessionStorage extends SessionStorage {
  constructor() {
    super();
    this.pool = pool;
  }

  async storeSession(session) {
    try {
      const client = await this.pool.connect();
      
      try {
        await client.query(`
          INSERT INTO "Session" (
            "id", "shop", "state", "isOnline", "scope", "expires", 
            "accessToken", "userId", "firstName", "lastName", "email", 
            "accountOwner", "locale", "collaborator", "emailVerified"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT ("id") DO UPDATE SET
            "shop" = EXCLUDED."shop",
            "state" = EXCLUDED."state",
            "isOnline" = EXCLUDED."isOnline",
            "scope" = EXCLUDED."scope",
            "expires" = EXCLUDED."expires",
            "accessToken" = EXCLUDED."accessToken",
            "userId" = EXCLUDED."userId",
            "firstName" = EXCLUDED."firstName",
            "lastName" = EXCLUDED."lastName",
            "email" = EXCLUDED."email",
            "accountOwner" = EXCLUDED."accountOwner",
            "locale" = EXCLUDED."locale",
            "collaborator" = EXCLUDED."collaborator",
            "emailVerified" = EXCLUDED."emailVerified"
        `, [
          session.id,
          session.shop,
          session.state,
          session.isOnline,
          session.scope,
          session.expires,
          session.accessToken,
          session.userId,
          session.firstName,
          session.lastName,
          session.email,
          session.accountOwner,
          session.locale,
          session.collaborator,
          session.emailVerified
        ]);
        
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error storing session:', error);
      return false;
    }
  }

  async loadSession(id) {
    try {
      const client = await this.pool.connect();
      
      try {
        const result = await client.query('SELECT * FROM "Session" WHERE "id" = $1', [id]);
        return result.rows[0] || undefined;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error loading session:', error);
      return undefined;
    }
  }

  async deleteSession(id) {
    try {
      const client = await this.pool.connect();
      
      try {
        await client.query('DELETE FROM "Session" WHERE "id" = $1', [id]);
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      return false;
    }
  }

  async deleteSessions(ids) {
    try {
      const client = await this.pool.connect();
      
      try {
        await client.query('DELETE FROM "Session" WHERE "id" = ANY($1)', [ids]);
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error deleting sessions:', error);
      return false;
    }
  }

  async findSessionsByShop(shop) {
    try {
      const client = await this.pool.connect();
      
      try {
        const result = await client.query('SELECT * FROM "Session" WHERE "shop" = $1', [shop]);
        return result.rows;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error finding sessions by shop:', error);
      return [];
    }
  }
}
