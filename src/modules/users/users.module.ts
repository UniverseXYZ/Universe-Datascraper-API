import { Module } from '@nestjs/common';
import { NFTTokenModule } from '../nft-token/nft-token.module';
import { NFTTransferModule } from '../nft-transfer/nft-transfer.module';
import { UsersController } from './users.controller';

@Module({
  imports: [NFTTokenModule, NFTTransferModule],
  controllers: [UsersController],
})
export class UsersModule {}
