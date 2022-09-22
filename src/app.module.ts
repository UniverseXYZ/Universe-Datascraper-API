import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import configuration from './modules/configuration';
import { DatabaseModule } from './modules/database/database.module';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './modules/database/database.service';
import { NFTTokenModule } from './modules/nft-token/nft-token.module';
import { NFTCollectionModule } from './modules/nft-collection/nft-collection.module';
import { NFTTransferModule } from './modules/nft-transfer/nft-transfer.module';
import { UsersModule } from './modules/users/users.module';
import { NFTTokenOwnersModule } from './modules/nft-token-owners/nft-token-owners.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: false,
      ignoreEnvVars: false,
      isGlobal: true,
      load: [configuration],
    }),
    TerminusModule,
    MongooseModule.forRootAsync({
      imports: [DatabaseModule],
      useExisting: DatabaseService,
    }),
    HealthModule,
    NFTTokenModule,
    NFTCollectionModule,
    NFTTransferModule,
    UsersModule,
    NFTTokenOwnersModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
