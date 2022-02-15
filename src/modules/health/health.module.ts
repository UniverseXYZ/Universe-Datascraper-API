import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DbHealthModule } from '../db-health/db-health.module';
import { DbHealthService } from '../db-health/db-health.service';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, DbHealthModule],
  providers: [DbHealthService],
  controllers: [HealthController],
})
export class HealthModule {}
