import { Module } from '@nestjs/common';
import { NFTTokenModule } from '../nft-token/nft-token.module';
import { NFTCollectionController } from './nft-collection.controller';

@Module({
  imports: [NFTTokenModule],
  controllers: [NFTCollectionController],
})
export class NFTCollectionModule {}
