import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NFTToken, NFTTokensDocument } from './schema/nft-token.schema';
import { GetUserTokensDto } from '../nft-token/dto/get-user-tokens.dto';
import { utils } from 'ethers';
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

  getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async getMoreFromCollection(
    contract: string,
    excludeTokenId: string,
    maxCount: number,
  ): Promise<NFTTokensDocument[]> {
    const limit = 20;

    if (maxCount > limit) {
      maxCount = limit;
    }

    const checkSumAddress = utils.getAddress(contract);
    const totalCount = await this.nftTokensModel
      .find({ contractAddress: checkSumAddress })
      .count();

    const upperMax = totalCount - maxCount;
    const max = upperMax >= 0 ? upperMax : 0;
    const randomNumber = this.getRandomInt(0, max);

    const query = { contractAddress: checkSumAddress } as any;
    if (excludeTokenId) {
      query.tokenId = { $not: { $regex: excludeTokenId } };
    }

    const results = await this.nftTokensModel
      .find({ ...query })
      .skip(randomNumber)
      .limit(maxCount);

    return results;
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
        $elemMatch: { address: ownerAddress },
      };
    }

    if (searchQuery?.tokenType) {
      query.tokenType = searchQuery.tokenType;
    }

    if (searchQuery?.tokenAddress) {
      query.contractAddress = utils.getAddress(searchQuery.tokenAddress);
    }

    if (searchQuery?.search) {
      query['metadata.name'] = { $regex: searchQuery.search };
    }

    return await this.nftTokensModel
      .find({ ...query })
      .skip(page * limit)
      .limit(limit);
  }

  async getCountByOwner(
    ownerAddress: string,
    searchQuery: GetUserTokensDto,
  ): Promise<number> {
    const query = {} as any;

    if (ownerAddress) {
      query.owners = {
        $elemMatch: { address: ownerAddress },
      };
    }

    if (searchQuery?.tokenType) {
      query.tokenType = searchQuery.tokenType;
    }

    if (searchQuery?.tokenAddress) {
      query.contractAddress = utils.getAddress(searchQuery.tokenAddress);
    }

    return await this.nftTokensModel.count({ ...query });
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
      .find({ contractAddress: utils.getAddress(contractAddress) })
      .skip(page * limit)
      .limit(limit);
  }

  async getCountByContract(contractAddress: string): Promise<number> {
    return await this.nftTokensModel.count({
      contractAddress: utils.getAddress(contractAddress),
    });
  }

  async getUserCollections(address: string) {
    return await this.nftTokensModel.distinct('contractAddress', {
      owners: {
        $elemMatch: { address: utils.getAddress(address) },
      },
    });
  }

  async refreshTokenData(contractAddress: string, tokenId: string) {
    await this.nftTokensModel.updateOne(
      { contractAddress, tokenId },
      { needToRefresh: true },
    );
  }
}
