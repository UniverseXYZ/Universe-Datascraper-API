import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NFTTokenOwnersService } from './nft-token-owners.service';
import {
  NFTTokenOwner,
  NFTTokenOwnerSchema,
  NFTErc1155TokenOwner,
  NFTErc1155TokenOwnerSchema,
} from 'datascraper-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NFTTokenOwner.name, schema: NFTTokenOwnerSchema },
    ]),
    MongooseModule.forFeature([
      { name: NFTErc1155TokenOwner.name, schema: NFTErc1155TokenOwnerSchema },
    ]),
  ],
  providers: [NFTTokenOwnersService],
  exports: [NFTTokenOwnersService],
})
export class NFTTokenOwnersModule {}
