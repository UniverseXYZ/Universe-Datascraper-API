import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NFTCollection,
  NFTCollectionAttributes,
  NFTCollectionAttributesrSchema,
  NFTCollectionSchema,
  NFTToken,
  NFTTokenOwner,
  NFTTokenOwnerSchema,
  NFTErc1155TokenOwner,
  NFTErc1155TokenOwnerSchema,
  NFTTokensSchema,
  NFTTransferHistory,
  NFTTransferHistorySchema,
} from 'datascraper-schema';
import { NFTTokenOwnersService } from '../nft-token-owners/nft-token-owners.service';
import { NFTTokenService } from '../nft-token/nft-token.service';
import { NFTTransferService } from '../nft-transfer/nft-transfer.service';
import { NftCollectionCronService } from './cron.service';
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
    MongooseModule.forFeature([
      { name: NFTTokenOwner.name, schema: NFTTokenOwnerSchema },
    ]),
    MongooseModule.forFeature([
      { name: NFTErc1155TokenOwner.name, schema: NFTErc1155TokenOwnerSchema },
    ]),
    MongooseModule.forFeature([
      {
        name: NFTCollectionAttributes.name,
        schema: NFTCollectionAttributesrSchema,
      },
    ]),
  ],
  controllers: [NFTCollectionController],
  providers: [
    NFTCollectionService,
    NFTTokenService,
    NFTTransferService,
    NFTTokenOwnersService,
    NftCollectionCronService,
  ],
  exports: [NftCollectionCronService],
})
export class NFTCollectionModule {}
