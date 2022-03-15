import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  NFTCollection,
  NFTCollectionDocument,
} from './schema/nft-collection.schema';
import {
  NFTToken,
  NFTTokensDocument,
} from '../nft-token/schema/nft-token.schema';
import { utils } from 'ethers';

@Injectable()
export class NFTCollectionService {
  constructor(
    @InjectModel(NFTCollection.name)
    private readonly nftCollectionsModel: Model<NFTCollectionDocument>,
    @InjectModel(NFTToken.name)
    private readonly nftTokensModel: Model<NFTTokensDocument>,
  ) {}

  public async getCollectionsByAddress(
    collections: string[],
  ): Promise<NFTCollectionDocument[]> {
    return await this.nftCollectionsModel.find(
      {
        contractAddress: { $in: collections },
      },
      {
        contractAddress: 1,
        name: 1,
        _id: 0,
      },
    );
  }

  public async searchCollections(
    search: string,
  ): Promise<NFTCollectionDocument[]> {
    const collection = await this.nftCollectionsModel.find({
      $or: [
        { contractAddress: search },
        { name: { $regex: new RegExp(search, 'i') } },
      ],
    });

    return collection;
  }

  /**
   * Returns certain data points for a single collection.
   * @param contract - contract (collection) address
   * @returns {Object}
   */
  public async getCollection(contractAddress: string) {
    const checkedAddress = utils.getAddress(contractAddress);
    const collectionInfo = await this.getCollectionsByAddress([checkedAddress]);
    const collection = collectionInfo[0];

    if (!collection) {
      // TODO:: if there is no such collection return 404
    }

    const ownersCount = await this.getOwnersCount(checkedAddress);

    return {
      owners: ownersCount,
      name: collection?.name || '',
      contractAddress: collection?.contractAddress || '',
    };
  }

  /**
   * Returns total number of owners who owns at least 1 token in collection.
   * @param contractAddress - collection address.
   * @returns {Promise<number>}
   */
  private async getOwnersCount(contractAddress: string): Promise<number> {
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
