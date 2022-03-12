import { Module } from '@nestjs/common';
import { NFTTokenOwnersModule } from '../nft-token-owners/nft-token-owners.module';
import { NFTTokenModule } from '../nft-token/nft-token.module';
import { NFTTransferModule } from '../nft-transfer/nft-transfer.module';
import { UsersController } from './users.controller';

@Module({
  imports: [NFTTokenModule, NFTTransferModule, NFTTokenOwnersModule],
  controllers: [UsersController],
})
export class UsersModule {}
