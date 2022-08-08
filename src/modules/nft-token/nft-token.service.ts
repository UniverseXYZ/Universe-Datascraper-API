import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  NFTToken,
  NFTTokensDocument,
  NFTCollection,
  NFTCollectionDocument,
  NFTTokenOwnerDocument,
  NFTCollectionAttributes,
  NFTCollectionAttributesDocument,
} from 'datascraper-schema';
import { GetUserTokensDto } from '../nft-token/dto/get-user-tokens.dto';
import { utils } from 'ethers';
import { constants } from '../../common/constants';
import { DatascraperException } from '../../common/exceptions/DatascraperException';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NFTTokenService {
  private readonly logger = new Logger(NFTTokenService.name);
  constructor(
    private configService: ConfigService,
    @InjectModel(NFTToken.name)
    private readonly nftTokensModel: Model<NFTTokensDocument>,
    @InjectModel(NFTCollectionAttributes.name)
    readonly nftCollectionAttributesModel: Model<NFTCollectionAttributesDocument>,
    @InjectModel(NFTCollection.name)
    private readonly nftCollectionsModel: Model<NFTCollectionDocument>,
  ) {}

  async getTokens(page: number, limit: number): Promise<NFTTokensDocument[]> {
    return await this.nftTokensModel
      .find({})
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
      query['owners.address'] = ownerAddress;
    }

    // if (searchQuery?.tokenType) {
    //   query.tokenType = searchQuery.tokenType;
    // }

    if (searchQuery?.tokenAddress) {
      query.contractAddress = utils.getAddress(searchQuery.tokenAddress);
    }

    if (searchQuery?.search) {
      query['metadata.name'] = { $regex: new RegExp(searchQuery.search, 'i') };
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
      query['owners.address'] = ownerAddress;
    }

    // if (searchQuery?.tokenType) {
    //   query.tokenType = searchQuery.tokenType;
    // }

    if (searchQuery?.tokenAddress) {
      query.contractAddress = utils.getAddress(searchQuery.tokenAddress);
    }

    if (searchQuery?.search) {
      query['metadata.name'] = { $regex: new RegExp(searchQuery.search, 'i') };
    }

    return await this.nftTokensModel.count({ ...query });
  }

  /**
   * Returns token data by contract address and token id.
   * @param contractAddress
   * @param tokenId
   * @returns
   * @throws {Error}
   */
  async getToken(
    contractAddress: string,
    tokenId: string,
  ): Promise<NFTTokensDocument> {
    const token = await this.nftTokensModel.findOne({
      contractAddress,
      tokenId,
    });

    if (!token) {
      throw new Error(
        `Token not found. Collection: ${contractAddress}, tokenId: ${tokenId}`,
      );
    }

    return token;
  }

  async getTokensByContract(
    contractAddress: string,
    page: number,
    limit: number,
    search: string,
    tokenIds: string[] | null,
  ): Promise<NFTTokensDocument[]> {
    const find = {} as any;
    find.contractAddress = utils.getAddress(contractAddress);
    if (search) {
      find['metadata.name'] = { $regex: new RegExp(search, 'i') };
    }

    if (tokenIds?.length) {
      find.tokenId = { $in: tokenIds };
    }

    return await this.nftTokensModel
      .find(find)
      .skip(page * limit)
      .limit(limit);
  }

  async getCountByContract(
    contractAddress: string,
    search: string,
    tokenIds: string[] | null,
  ): Promise<number> {
    const find = {} as any;
    find.contractAddress = utils.getAddress(contractAddress);
    if (search) {
      find['metadata.name'] = { $regex: new RegExp(search, 'i') };
    }

    if (tokenIds?.length) {
      find.tokenId = { $in: tokenIds };
    }

    return await this.nftTokensModel.count(find);
  }

  async getUserCollections(address: string) {
    return await this.nftTokensModel.distinct('contractAddress', {
      'owners.address': utils.getAddress(address),
    });
  }

  async refreshTokenData(contractAddress: string, tokenId: string) {
    await this.nftTokensModel.updateOne(
      { contractAddress, tokenId },
      { needToRefresh: true },
    );
  }

  /**
   * Sets the needToRefresh property to true to all tokens of the passed collection.
   * @param contractAddress
   * @returns {Promise<string>}
   * @throws {DatascraperException}
   */
  public async refreshTokenDataByCollection(contractAddress: string) {
    if (!ethers.utils.isAddress(contractAddress.toLowerCase())) {
      throw new DatascraperException(constants.INVALID_CONTRACT_ADDRESS);
    }

    const checkSumAddress = utils.getAddress(contractAddress);

    const collection = await this.nftCollectionsModel.findOne({
      contractAddress: checkSumAddress,
    });
    if (!collection) {
      throw new DatascraperException(constants.CONTRACT_NOT_FOUND);
    }

    if (collection.lastRefresh) {
      const currentDate = new Date();
      const nextAllowedRefreshDate = new Date();
      nextAllowedRefreshDate.setDate(
        collection.lastRefresh.getDate() +
          this.configService.get('refreshDelayDays'),
      );

      if (currentDate < nextAllowedRefreshDate) {
        throw new DatascraperException(constants.COLLECTION_ALREADY_REFRESHED);
      }
    }
    // waiting just in case to make sure the client knows if the request was successful.
    await this.nftTokensModel.updateMany(
      {
        contractAddress: checkSumAddress,
      },
      { needToRefresh: true },
    );

    await this.nftCollectionsModel.updateOne(
      {
        contractAddress: checkSumAddress,
      },
      {
        lastRefresh: new Date(),
      },
    );

    return 'OK';
  }

  async getTokensDetailsByTokens(
    tokenOwners: NFTTokenOwnerDocument[],
    searchQuery: GetUserTokensDto,
    page: number,
    limit: number,
  ) {
    const query = {} as any;

    if (searchQuery?.tokenType) {
      query.tokenType = searchQuery.tokenType;
    }

    if (searchQuery?.tokenAddress) {
      query.contractAddress = utils.getAddress(searchQuery.tokenAddress);
    }

    if (searchQuery?.search) {
      query['metadata.name'] = { $regex: new RegExp(searchQuery.search, 'i') };
    }

    query['$or'] = tokenOwners.map((owner) => {
      return {
        contractAddress: owner.contractAddress,
        tokenId: owner.tokenId,
      };
    });

    const tokens = await this.nftTokensModel
      .find({ ...query })
      .sort({ updatedAt: -1 })
      .skip(page * limit)
      .limit(limit);
    const count = await this.nftTokensModel.count({ ...query });

    return { tokens, count };
  }

  async getTokenAttributes(
    contractAddress: string,
  ): Promise<NFTCollectionAttributesDocument> {
    const result = await this.nftCollectionAttributesModel.findOne(
      {
        contractAddress: utils.getAddress(contractAddress),
      },
      { attributes: 1, _id: 0 },
    );

    return result.attributes;
  }
}
