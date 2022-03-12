import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NFTCollection,
  NFTCollectionSchema,
  NFTToken,
  NFTTokensSchema,
  NFTTransferHistory,
  NFTTransferHistorySchema,
} from 'datascraper-schema';
import { NFTTokenOwnersModule } from '../nft-token-owners/nft-token-owners.module';
import { NFTTokenService } from '../nft-token/nft-token.service';
import { NFTTransferService } from '../nft-transfer/nft-transfer.service';
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
    MongooseModule.forFeature([
      { name: NFTTransferHistory.name, schema: NFTTransferHistorySchema },
    ]),
    NFTTokenOwnersModule,
  ],
  controllers: [NFTCollectionController],
  providers: [NFTCollectionService, NFTTokenService, NFTTransferService],
})
export class NFTCollectionModule {}
