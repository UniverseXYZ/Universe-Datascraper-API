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
  ): Promise<{ tokenOwners: NFTTokenOwnerDocument[]; count: number }> {
    const query = {} as any;

    if (ownerAddress) {
      query.address = ownerAddress;
    }

    // if (searchQuery?.tokenType) {
    //   query.tokenType = searchQuery.tokenType;
    // }
    query.tokenType = 'ERC721';

    if (searchQuery?.tokenAddress) {
      query.contractAddress = utils.getAddress(searchQuery.tokenAddress);
    }

    const [tokenOwners, count] = await Promise.all([
      this.nftTokenOwnersModel.find({ ...query }),
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

    return await this.nftTokenOwnersModel.find({ $or: query });
  }

  async getOwners(
    tokenOwners: NFTTokenOwnerDocument[],
  ): Promise<NFTTokenOwnerDocument[]> {
    const query = tokenOwners.map((token) => ({
      contractAddress: token.contractAddress,
      tokenId: token.tokenId,
    }));

    return await this.nftTokenOwnersModel.find({ $or: query });
  }

  async getUserCollections(address: string) {
    return await this.nftTokenOwnersModel.distinct('contractAddress', {
      address: utils.getAddress(address),
    });
  }
}
