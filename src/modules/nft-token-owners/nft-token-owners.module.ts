import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NFTTokenOwnersService } from './nft-token-owners.service';
import {
  NFTTokenOwner,
  NFTTokenOwnerSchema,
} from './schema/nft-token-owners.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NFTTokenOwner.name, schema: NFTTokenOwnerSchema },
    ]),
  ],
  providers: [NFTTokenOwnersService],
  exports: [NFTTokenOwnersService],
})
export class NFTTokenOwnersModule {}
