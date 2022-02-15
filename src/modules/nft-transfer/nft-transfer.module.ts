import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NFTTransferController } from './nft-transfer.controller';
import { NFTTransferService } from './nft-transfer.service';
import {
  NFTTransferHistory,
  NFTTransferHistorySchema,
} from './schema/nft-transfer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NFTTransferHistory.name, schema: NFTTransferHistorySchema },
    ]),
  ],
  providers: [NFTTransferService],
  exports: [NFTTransferService],
  controllers: [NFTTransferController],
})
export class NFTTransferModule {}
