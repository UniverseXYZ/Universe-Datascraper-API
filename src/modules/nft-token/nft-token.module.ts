import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NFTCollectionAttributes,
  NFTCollectionAttributesrSchema,
} from 'datascraper-schema';
import { NFTTokenOwnersModule } from '../nft-token-owners/nft-token-owners.module';
import { NFTTokenController } from './nft-token.controller';
import { NFTTokenService } from './nft-token.service';
import { NFTToken, NFTTokensSchema } from './schema/nft-token.schema';

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
  ],
  providers: [NFTTokenService],
  exports: [NFTTokenService],
  controllers: [NFTTokenController],
})
export class NFTTokenModule {}
