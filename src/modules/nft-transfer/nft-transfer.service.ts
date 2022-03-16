import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  NFTTransferHistory,
  NFTTransferHistoryDocument,
} from './schema/nft-transfer.schema';
import { utils } from 'ethers';

@Injectable()
export class NFTTransferService {
  constructor(
    @InjectModel(NFTTransferHistory.name)
    private readonly nftTransferModel: Model<NFTTransferHistoryDocument>,
  ) {}

  async getTransferByTokenId(
    contractAddress: string,
    tokenId: string,
    page: number,
    limit: number,
  ): Promise<NFTTransferHistoryDocument[]> {
    return await this.nftTransferModel
      .find({ contractAddress, tokenId })
      .skip(page * limit)
      .limit(limit);
  }

  async getCountByTokenId(
    contractAddress: string,
    tokenId: string,
  ): Promise<number> {
    return await this.nftTransferModel.count({ contractAddress, tokenId });
  }

  async getTransferByUserAddress(
    userAddress: string,
    page: number,
    limit: number,
  ): Promise<NFTTransferHistoryDocument[]> {
    return await this.nftTransferModel
      .find({ $or: [{ to: userAddress }, { from: userAddress }] })
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit);
  }

  async getCountByUserAddress(userAddress: string): Promise<number> {
    return await this.nftTransferModel.count({
      $or: [{ to: userAddress }, { from: userAddress }],
    });
  }
}
