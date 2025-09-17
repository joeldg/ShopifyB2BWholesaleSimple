import { SessionStorage } from "@shopify/shopify-app-session-storage";
import fs from 'fs/promises';
import path from 'path';

export class FileSessionStorage extends SessionStorage {
  constructor() {
    super();
    this.sessionsDir = path.join(process.cwd(), 'sessions');
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create sessions directory:', error);
    }
  }

  getSessionPath(id) {
    return path.join(this.sessionsDir, `${id}.json`);
  }

  async storeSession(session) {
    try {
      const sessionPath = this.getSessionPath(session.id);
      await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));
      return true;
    } catch (error) {
      console.error('Error storing session:', error);
      return false;
    }
  }

  async loadSession(id) {
    try {
      const sessionPath = this.getSessionPath(id);
      const data = await fs.readFile(sessionPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist or can't be read
      return undefined;
    }
  }

  async deleteSession(id) {
    try {
      const sessionPath = this.getSessionPath(id);
      await fs.unlink(sessionPath);
      return true;
    } catch (error) {
      // File doesn't exist
      return false;
    }
  }

  async deleteSessions(ids) {
    const results = await Promise.all(ids.map(id => this.deleteSession(id)));
    return results.every(result => result);
  }

  async findSessionsByShop(shop) {
    try {
      const files = await fs.readdir(this.sessionsDir);
      const sessions = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const data = await fs.readFile(path.join(this.sessionsDir, file), 'utf8');
            const session = JSON.parse(data);
            if (session.shop === shop) {
              sessions.push(session);
            }
          } catch (error) {
            // Skip invalid files
            continue;
          }
        }
      }
      
      return sessions;
    } catch (error) {
      console.error('Error finding sessions by shop:', error);
      return [];
    }
  }
}
