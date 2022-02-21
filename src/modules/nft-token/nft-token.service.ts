import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NFTToken, NFTTokensDocument } from './schema/nft-token.schema';
import { GetUserTokensDto } from '../nft-token/dto/get-user-tokens.dto';


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
    searchQuery: GetUserTokensDto,
    page: number,
    limit: number,
  ): Promise<NFTTokensDocument[]> {
    const query = {} as any;

    if (ownerAddress) {
      query.owners = {
        $elemMatch: {address: ownerAddress}
      };
    }

    if (searchQuery?.tokenType) {
      query.tokenType = searchQuery.tokenType;
    }

    return await this.nftTokensModel
      .find({...query})
      .skip(page * limit)
      .limit(limit);
  }

  async getCountByOwner(ownerAddress: string, searchQuery: GetUserTokensDto): Promise<number> {
    const query = {} as any;

    if (ownerAddress) {
      query.owners = {
        $elemMatch: {address: ownerAddress}
      };
    }

    if (searchQuery?.tokenType) {
      query.tokenType = searchQuery.tokenType;
    }

    return await this.nftTokensModel.count({...query});
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
