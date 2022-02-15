import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NFTTokenController } from './nft-token.controller';
import { NFTTokenService } from './nft-token.service';
import { NFTToken, NFTTokensSchema } from './schema/nft-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NFTToken.name, schema: NFTTokensSchema },
    ]),
  ],
  providers: [NFTTokenService],
  exports: [NFTTokenService],
  controllers: [NFTTokenController],
})
export class NFTTokenModule {}
