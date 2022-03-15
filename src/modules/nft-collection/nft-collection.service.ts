import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  NFTCollection,
  NFTCollectionDocument,
} from './schema/nft-collection.schema';
import { NFTTokenService } from '../nft-token/nft-token.service';
<<<<<<< HEAD
import { utils } from 'ethers';
=======
>>>>>>> 622750e (m-1355: Integrate total volume traded functionality in collections)

@Injectable()
export class NFTCollectionService {
  constructor(
    @InjectModel(NFTCollection.name)
    private readonly nftCollectionsModel: Model<NFTCollectionDocument>,
<<<<<<< HEAD
    private readonly nftTokenService: NFTTokenService,
=======
    private nftTokenService: NFTTokenService,
>>>>>>> 622750e (m-1355: Integrate total volume traded functionality in collections)
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

    const ownersCount = await this.nftTokenService.getCollectionOwnersCount(
      checkedAddress,
    );

    return {
      owners: ownersCount,
      name: collection?.name || '',
      contractAddress: collection?.contractAddress || '',
    };
  }
}
