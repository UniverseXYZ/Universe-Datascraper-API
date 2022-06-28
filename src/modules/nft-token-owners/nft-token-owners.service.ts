import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import {
  NFTTokenOwner,
  NFTTokenOwnerDocument,
  NFTErc1155TokenOwner,
  NFTErc1155TokenOwnerDocument,
} from 'datascraper-schema';
import { NFTTokensDocument } from '../nft-token/schema/nft-token.schema';
import { GetUserTokensDto } from '../nft-token/dto/get-user-tokens.dto';
import { utils } from 'ethers';

@Injectable()
export class NFTTokenOwnersService {
  constructor(
    @InjectModel(NFTTokenOwner.name)
    private readonly nftTokenOwnersModel: Model<NFTTokenOwnerDocument>,
    @InjectModel(NFTErc1155TokenOwner.name)
    private readonly nftErc1155TokenOwnersModel: Model<NFTErc1155TokenOwnerDocument>,
  ) {}

  async getTokensByOwnerAddress(
    ownerAddress: string,
    searchQuery: GetUserTokensDto,
  ): Promise<NFTTokenOwnerDocument[]> {
    const query = {} as any;

    if (ownerAddress) {
      query.address = ownerAddress;
    }

    // if (searchQuery?.tokenType) {
    //   query.tokenType = searchQuery.tokenType;
    // }

    if (searchQuery?.tokenAddress) {
      query.contractAddress = utils.getAddress(searchQuery.tokenAddress);
    }

    const tokenOwners = await this.nftTokenOwnersModel.find({ ...query });

    return tokenOwners;
  }

  /**
   * Returns token owners by collection address and token id.
   * @param contractAddress
   * @param tokenId
   * @returns Promise<any[]> - array or owners.
   */
  async getOwnersByContractAndTokenId(
    contractAddress: string,
    tokenId: string,
  ): Promise<any[]> {
    let value = [];

    //first try to fetch owners from the nft-token-owners "table"
    let owners = await this.nftTokenOwnersModel.find(
      {
        contractAddress: contractAddress,
        tokenId: tokenId,
      },
      '-_id address value',
    );
    if (owners.length) {
      value = owners;
    } else {
      //if found nothing, check out the nft-erc1155-token-owners "table"
      owners = await this.nftErc1155TokenOwnersModel.find(
        {
          contractAddress: contractAddress,
          tokenId: tokenId,
        },
        '-_id address value',
      );
      value = owners;
    }

    return value;
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
