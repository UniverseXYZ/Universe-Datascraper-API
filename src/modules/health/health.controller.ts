import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { DbHealthService } from '../db-health/db-health.service';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: DbHealthService,
  ) {}

  @Get()
  @HealthCheck()
  async health_check() {
    // TODO: check health
    return this.health.check([() => this.db.pingCheck('mongodb')]);
  }
}
