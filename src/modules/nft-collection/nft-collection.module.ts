import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NFTCollection,
  NFTCollectionSchema,
  NFTToken,
  NFTTokensSchema,
} from 'datascraper-schema';
import { NFTTokenService } from '../nft-token/nft-token.service';
import { NFTCollectionController } from './nft-collection.controller';
import { NFTCollectionService } from './nft-collection.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NFTCollection.name, schema: NFTCollectionSchema },
    ]),
    MongooseModule.forFeature([
      { name: NFTToken.name, schema: NFTTokensSchema },
    ]),
  ],
  controllers: [NFTCollectionController],
  providers: [NFTCollectionService, NFTTokenService],
})
export class NFTCollectionModule {}
