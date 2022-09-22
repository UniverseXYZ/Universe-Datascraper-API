import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NFTCollection,
  NFTCollectionAttributes,
  NFTCollectionAttributesrSchema,
  NFTCollectionSchema,
  NFTToken,
  NFTTokensSchema,
} from 'datascraper-schema';
import { NFTTokenOwnersModule } from '../nft-token-owners/nft-token-owners.module';
import { NFTTokenController } from './nft-token.controller';
import { NFTTokenService } from './nft-token.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NFTToken.name, schema: NFTTokensSchema },
    ]),
    NFTTokenOwnersModule,
    MongooseModule.forFeature([
      {
        name: NFTCollectionAttributes.name,
        schema: NFTCollectionAttributesrSchema,
      },
    ]),
    MongooseModule.forFeature([
      { name: NFTCollection.name, schema: NFTCollectionSchema },
    ]),
  ],
  providers: [NFTTokenService],
  exports: [NFTTokenService],
  controllers: [NFTTokenController],
})
export class NFTTokenModule {}
