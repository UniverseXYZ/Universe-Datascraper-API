import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { utils } from 'ethers';
import {
  NFTCollectionAttributes,
  NFTCollectionAttributesDocument,
  NFTTokenOwner,
  NFTTokenOwnerDocument,
  NFTCollection,
  NFTCollectionDocument,
  NFTToken,
} from 'datascraper-schema';

@Injectable()
export class NFTCollectionService {
  constructor(
    @InjectModel(NFTCollection.name)
    private readonly nftCollectionsModel: Model<NFTCollectionDocument>,
    @InjectModel(NFTTokenOwner.name)
    private readonly nftTokenOwnersModel: Model<NFTTokenOwnerDocument>,
    @InjectModel(NFTCollectionAttributes.name)
    readonly nftCollectionAttributesModel: Model<NFTCollectionAttributesDocument>,
    @InjectModel(NFTToken.name)
    private readonly nftTokenModel: Model<NFTToken>,
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
      throw new Error(`Collection not found. Collection: ${checkedAddress}`);
    }

    const ownersCount = await this.getOwnersCount(checkedAddress);

    return {
      owners: ownersCount,
      name: collection?.name || '',
      contractAddress: collection?.contractAddress || '',
    };
  }

  public async updateCollectionAttributes(contractAddress: string) {
    const start = new Date().getTime();
    const collection = utils.getAddress(contractAddress);

    const total = await this.nftTokenModel.countDocuments({
      contractAddress: collection,
    });

    const limit = 1000; //config
    let offset = 0;

    const filter = {
      $and: [
        { contractAddress: utils.getAddress(contractAddress) },
        { 'metadata.attributes': { $exists: true } },
        { 'metadata.attributes': { $ne: null } },
      ],
    };
    const shape = { tokenId: 1, 'metadata.attributes': 1, _id: 0 };
    const tokens = [];
    do {
      const tokenBatches = await this.nftTokenModel
        .find(filter, shape)
        .limit(limit)
        .skip(offset);

      offset += limit;
      tokens.push(tokenBatches);
    } while (limit + offset < total);

    const traits = tokens
      .flat()
      .reduce((acc, { tokenId, metadata: { attributes } }) => {
        attributes.forEach(({ trait_type, value }) => {
          acc[trait_type] = acc[trait_type] || {};
          acc[trait_type][value] = acc[trait_type][value] || [];
          acc[trait_type][value].push(tokenId);
        });
        return acc;
      }, {});

    const nftCollection = {
      contractAddress: collection,
      attributes: traits,
    };

    await this.nftCollectionAttributesModel.updateOne(
      { contractAddress: collection },
      { $set: nftCollection },
      { upsert: true },
    );
    console.log((new Date().getTime() - start) / 1000);

    return 'Finished';
  }

  /**
   * Returns total number of owners who owns at least 1 token in collection.
   * @param contractAddress - collection address.
   * @returns {Promise<number>}
   */
  private async getOwnersCount(contractAddress: string): Promise<number> {
    const uniqueOwners = await this.nftTokenOwnersModel.distinct('address', {
      contractAddress,
    });

    return uniqueOwners.length;
  }
}
