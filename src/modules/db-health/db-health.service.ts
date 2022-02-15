import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DbHealthService extends HealthIndicator {
  constructor(@InjectConnection() private readonly connection: Connection) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      const db = this.connection.db;
      const { ok } = await db.command({ ping: 1 });
      if (ok) {
        return this.getStatus(key, true, { message: 'DB is healthy' });
      }

      return this.getStatus(key, false, { message: 'DB is not healthy' });
    } catch (error) {
      return this.getStatus(key, false, { message: error.message });
    }
  }
}
