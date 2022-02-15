import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DbHealthService } from './db-health.service';

@Module({
  imports: [TerminusModule],
  providers: [DbHealthService],
  exports: [DbHealthService],
})
export class DbHealthModule {}
