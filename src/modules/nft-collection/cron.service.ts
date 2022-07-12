import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import {
  NFTCollectionAttributes,
  NFTCollectionAttributesDocument,
  NFTCollection,
  NFTCollectionDocument,
  NFTToken,
} from 'datascraper-schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isEmpty } from 'lodash';

@Injectable()
export class NftCollectionCronService {
  private logger;

  constructor(
    @InjectModel(NFTCollection.name)
    private readonly nftCollectionsModel: Model<NFTCollectionDocument>,
    @InjectModel(NFTCollectionAttributes.name)
    readonly nftCollectionAttributesModel: Model<NFTCollectionAttributesDocument>,
    @InjectModel(NFTToken.name)
    private readonly nftTokenModel: Model<NFTToken>,
  ) {
    this.logger = new Logger(this.constructor.name);

    this.updateCollectionAttributes();
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  private async updateCollectionAttributes() {
    const collections = await this.nftCollectionsModel.find(
      {
        attributesUpdated: false,
      },
      {},
      {
        limit: 10,
      },
    );

    for (const collection of collections) {
      collection.attributesUpdated = true;
      collection.save();

      const total = await this.nftTokenModel.countDocuments({
        contractAddress: collection.contractAddress,
      });

      const limit = 1000; //config
      let offset = 0;

      try {
        const filter = {
          contractAddress: collection.contractAddress,
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

          this.logger.log(
            'Updating attributes for collection: ' + collection.contractAddress,
          );

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

        this.logger.log(
          'NFT collection attributes updated ' + collection.contractAddress,
        );
      } catch (e) {
        collection.attributesUpdated = false;
        collection.save();

        throw e;
      }
    }
  }
}