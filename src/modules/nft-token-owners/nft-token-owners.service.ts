import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import {
  NFTTokenOwner,
  NFTTokenOwnerDocument,
} from './schema/nft-token-owners.schema';
import { NFTTokensDocument } from '../nft-token/schema/nft-token.schema';
import { GetUserTokensDto } from '../nft-token/dto/get-user-tokens.dto';
import { utils } from 'ethers';

@Injectable()
export class NFTTokenOwnersService {
  constructor(
    @InjectModel(NFTTokenOwner.name)
    private readonly nftTokenOwnersModel: Model<NFTTokenOwnerDocument>,
  ) {}

  async getTokensByOwnerAddress(
    ownerAddress: string,
    searchQuery: GetUserTokensDto,
    page: number,
    limit: number,
  ): Promise<{ tokenOwners: NFTTokenOwnerDocument[]; count: number }> {
    const query = {} as any;

    if (ownerAddress) {
      query.address = ownerAddress;
    }

    if (searchQuery?.tokenType) {
      query.tokenType = searchQuery.tokenType;
    }

    if (searchQuery?.tokenAddress) {
      query.contractAddress = utils.getAddress(searchQuery.tokenAddress);
    }

    if (searchQuery?.search) {
      query.tokenName = { $regex: searchQuery.search };
    }

    const [tokenOwners, count] = await Promise.all([
      this.nftTokenOwnersModel
        .find({ ...query })
        .skip(page * limit)
        .limit(limit),
      this.nftTokenOwnersModel.count({ ...query }),
    ]);

    return { tokenOwners, count };
  }

  async getOwnersByContractAndTokenId(
    contractAddress: string,
    tokenId: string,
  ): Promise<NFTTokenOwnerDocument[]> {
    return await this.nftTokenOwnersModel.find({ contractAddress, tokenId });
  }

  async getOwnersByTokens(
    tokens: NFTTokensDocument[],
  ): Promise<NFTTokenOwnerDocument[]> {
    const query = tokens.map((token) => ({
      contractAddress: token.contractAddress,
      tokenId: token.tokenId,
    }));
    console.log(query);
    return await this.nftTokenOwnersModel.find({ $or: query });
  }

  async getOwners(
    tokenOwners: NFTTokenOwnerDocument[],
  ): Promise<NFTTokenOwnerDocument[]> {
    const query = tokenOwners.map((token) => ({
      contractAddress: token.contractAddress,
      tokenId: token.tokenId,
    }));
    console.log(query);
    return await this.nftTokenOwnersModel.find({ $or: query });
  }
}