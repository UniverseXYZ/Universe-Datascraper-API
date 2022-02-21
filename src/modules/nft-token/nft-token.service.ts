import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NFTToken, NFTTokensDocument } from './schema/nft-token.schema';

@Injectable()
export class NFTTokenService {
  constructor(
    @InjectModel(NFTToken.name)
    private readonly nftTokensModel: Model<NFTTokensDocument>,
  ) {}

  async getTokens(page: number, limit: number): Promise<NFTTokensDocument[]> {
    return await this.nftTokensModel
      .find()
      .skip(page * limit)
      .limit(limit);
  }

  async getCount(): Promise<number> {
    return await this.nftTokensModel.count();
  }

  async getTokensByOwner(
    ownerAddress: string,
    page: number,
    limit: number,
  ): Promise<NFTTokensDocument[]> {
    return await this.nftTokensModel
      .find({ owners: { $elemMatch: { address: ownerAddress } } })
      .skip(page * limit)
      .limit(limit);
  }

  async getCountByOwner(ownerAddress: string): Promise<number> {
    return await this.nftTokensModel.count({
      owners: { $elemMatch: { address: ownerAddress } },
    });
  }

  async getToken(
    contractAddress: string,
    tokenId: string,
  ): Promise<NFTTokensDocument> {
    return await this.nftTokensModel.findOne({
      contractAddress,
      tokenId,
    });
  }

  async getTokensByContract(
    contractAddress: string,
    page: number,
    limit: number,
  ): Promise<NFTTokensDocument[]> {
    return await this.nftTokensModel
      .find({ contractAddress })
      .skip(page * limit)
      .limit(limit);
  }

  async getCountByContract(contractAddress: string): Promise<number> {
    return await this.nftTokensModel.count({ contractAddress });
  }

  async refreshTokenData(contractAddress: string, tokenId: string) {
    await this.nftTokensModel.updateOne(
      { contractAddress, tokenId },
      { needToRefresh: true },
    );
  }
}
