import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NFTToken, NFTTokensDocument } from './schema/nft-token.schema';
import { GetUserTokensDto } from '../nft-token/dto/get-user-tokens.dto';
import { utils } from 'ethers';
import { NFTTokenOwnerDocument } from '../nft-token-owners/schema/nft-token-owners.schema';

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
      query['owners.address'] = ownerAddress;
    }

    if (searchQuery?.tokenType) {
      query.tokenType = searchQuery.tokenType;
    }

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

    if (searchQuery?.tokenType) {
      query.tokenType = searchQuery.tokenType;
    }

    if (searchQuery?.tokenAddress) {
      query.contractAddress = utils.getAddress(searchQuery.tokenAddress);
    }

    if (searchQuery?.search) {
      query['metadata.name'] = { $regex: new RegExp(searchQuery.search, 'i') };
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
    search: string,
  ): Promise<NFTTokensDocument[]> {
    const find = {} as any;
    find.contractAddress = utils.getAddress(contractAddress);
    if (search) {
      find['metadata.name'] = { $regex: new RegExp(search, 'i') };
    }

    return await this.nftTokensModel
      .find(find)
      .skip(page * limit)
      .limit(limit);
  }

  async getCountByContract(
    contractAddress: string,
    search: string,
  ): Promise<number> {
    const find = {} as any;
    find.contractAddress = utils.getAddress(contractAddress);
    if (search) {
      find['metadata.name'] = { $regex: new RegExp(search, 'i') };
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

  async getTokensDetailsByTokens(
    tokenOwners: NFTTokenOwnerDocument[],
  ): Promise<NFTTokensDocument[]> {
    const query = tokenOwners.map((owner) => {
      return {
        contractAddress: owner.contractAddress,
        tokenId: owner.tokenId,
      };
    });
    return await this.nftTokensModel.find({ $or: query });
  }

  /**
   * Returns total number of owners who owns at least 1 token in collection.
   * @param contractAddress - collection address.
   * @returns {Promise<number>}
   */
  public async getCollectionOwnersCount(
    contractAddress: string,
  ): Promise<number> {
    let value = 0;

    /**
     * I left this distinct() call commented out to be able to quickly compare the results between
     * the .distinct() and the .aggregate() approaches.
     * But eventually I went with the .aggregate() method because the resulting array from
     * .distinct() might be pretty large (consider a collection with 10^18 tokens and each
     * token is owned by a unique address) but it must not be larger than the maximum BSON size (16MB).
     * @See https://docs.mongodb.com/manual/reference/limits/
     */
    // const uniqueOwners = await this.nftTokensModel.distinct('owners.address', {
    //   contractAddress: contractAddress,
    // });
    // value = uniqueOwners.length;

    const owners = await this.nftTokensModel.aggregate([
      {
        $match: {
          contractAddress: contractAddress,
        },
      },
      {
        $group: {
          _id: null,
          uniqueOwners: {
            $addToSet: {
              owner: '$owners.address',
            },
          },
        },
      },
      {
        $project: {
          count: {
            $size: '$uniqueOwners',
          },
        },
      },
    ]);
    if (owners.length > 0 && owners[0].count) {
      value = owners[0].count;
    }

    return value;
  }
}
