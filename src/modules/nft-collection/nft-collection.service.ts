import { BadRequestException, Injectable } from '@nestjs/common';
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
  NFTErc1155TokenOwner,
  NFTErc1155TokenOwnerDocument,
} from 'datascraper-schema';
import { isEmpty } from 'lodash';
import { SearchCollectionParams } from './dto/search-collection.dto';

@Injectable()
export class NFTCollectionService {
  constructor(
    @InjectModel(NFTCollection.name)
    private readonly nftCollectionsModel: Model<NFTCollectionDocument>,
    @InjectModel(NFTTokenOwner.name)
    private readonly nftTokenOwnersModel: Model<NFTTokenOwnerDocument>,
    @InjectModel(NFTErc1155TokenOwner.name)
    private readonly nftErc1155TokenOwnersModel: Model<NFTErc1155TokenOwnerDocument>,
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
        tokenType: 1,
        createdAtBlock: 1,
        symbol: 1,
        _id: 0,
      },
    );
  }

  public async searchCollections({
    contractAddresses,
    search,
  }: SearchCollectionParams): Promise<NFTCollectionDocument[]> {
    const filter = contractAddresses?.length
      ? {
          contractAddress: { $in: contractAddresses },
        }
      : {
          $or: [
            { contractAddress: search },
            { name: { $regex: new RegExp(search, 'i') } },
          ],
        };
    const collection = await this.nftCollectionsModel.find(filter);

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
    let ownersCount = 0;
    switch (collection.tokenType) {
      case 'ERC721':
        ownersCount = await this.getERC721OwnersCount(checkedAddress);
        break;
      case 'ERC1155':
        ownersCount = await this.getERC1155OwnersCount(checkedAddress);
        break;
      default:
        break;
    }

    return {
      owners: ownersCount,
      name: collection?.name || '',
      contractAddress: collection?.contractAddress || '',
      tokenType: collection?.tokenType || '',
      createdAtBlock: collection?.createdAtBlock || '',
      symbol: collection?.symbol || '',
    };
  }

  public async updateCollectionAttributes(contractAddress: string) {
    const collection = await this.nftCollectionsModel.findOne({
      contractAddress: utils.getAddress(contractAddress),
    });

    const total = await this.nftTokenModel.countDocuments({
      contractAddress: collection.contractAddress,
    });

    const limit = 1000; //config
    let offset = 0;

    const filter = {
      contractAddress: utils.getAddress(contractAddress),
      'metadata.attributes': { $exists: true, $ne: null },
    };
    const shape = { tokenId: 1, 'metadata.attributes': 1, _id: 0 };

    const traits = {};
    do {
      const tokenBatch = await this.nftTokenModel
        .find(filter, shape)
        .limit(limit)
        .skip(offset);

      offset += limit;

      if (tokenBatch.length) {
        tokenBatch.forEach(({ tokenId, metadata: { attributes } }) => {
          attributes.forEach(({ trait_type, value }) => {
            traits[trait_type] = traits[trait_type] || {};
            traits[trait_type][value] = traits[trait_type][value] || [];
            traits[trait_type][value].push(tokenId);
          });
        });
      }
    } while (limit + offset < total);

    if (isEmpty(traits)) {
      return "Collection doesn't have attributes";
    }

    const nftCollection = {
      contractAddress: collection.contractAddress,
      attributes: traits,
    };

    await this.nftCollectionAttributesModel.updateOne(
      { contractAddress: collection.contractAddress },
      { $set: nftCollection },
      { upsert: true },
    );

    collection.attributesUpdated = true;
    collection.save();

    return 'NFT collection attributes updated';
  }

  public async getTokenIdsByCollectionAttributes(
    contractAddress: string,
    traits: Record<string, string>,
  ) {
    const allTraitsArray = [];

    // construct fields for the database query
    for (const trait in traits) {
      traits[trait].split(',').forEach((type) => {
        const field = `$attributes.${trait}.${type}`;
        allTraitsArray.push(field);
      });
    }

    const filter = {
      contractAddress: utils.getAddress(contractAddress),
    };

    try {
      const tokenIds = await this.nftCollectionAttributesModel.aggregate([
        { $match: filter },
        {
          $project: {
            tokens: {
              $concatArrays: allTraitsArray,
            },
          },
        },
        {
          $group: {
            _id: null,
            tokens: { $addToSet: '$tokens' },
          },
        },
        { $unwind: '$tokens' },
        { $unset: '_id' },
      ]);

      return tokenIds[0]?.tokens || [];
    } catch (error) {
      throw new BadRequestException();
    }
  }

  /**
   * Returns total number of owners who owns at least 1 token in an ERC721 collection.
   * @param contractAddress - collection address.
   * @returns {Promise<number>}
   */
  private async getERC721OwnersCount(contractAddress: string): Promise<number> {
    const uniqueOwners = await this.nftTokenOwnersModel.distinct('address', {
      contractAddress,
    });

    return uniqueOwners.length;
  }

  /**
   * Returns total number of owners who owns at least 1 token in an ERC1155 collection.
   * @param contractAddress - collection address.
   * @returns {Promise<number>}
   */
  private async getERC1155OwnersCount(
    contractAddress: string,
  ): Promise<number> {
    const uniqueOwners = await this.nftErc1155TokenOwnersModel.distinct(
      'address',
      {
        contractAddress,
      },
    );

    return uniqueOwners.length;
  }
}
