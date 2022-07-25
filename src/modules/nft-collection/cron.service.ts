import { ConfigService } from '@nestjs/config';
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
  private disableAggregation: boolean;

  constructor(
    private configService: ConfigService,
    @InjectModel(NFTCollection.name)
    private readonly nftCollectionsModel: Model<NFTCollectionDocument>,
    @InjectModel(NFTCollectionAttributes.name)
    readonly nftCollectionAttributesModel: Model<NFTCollectionAttributesDocument>,
    @InjectModel(NFTToken.name)
    private readonly nftTokenModel: Model<NFTToken>,
  ) {
    this.logger = new Logger(this.constructor.name);
    this.disableAggregation = JSON.parse(
      this.configService.get('disableAggregation'),
    );
    this.logger.log(`Disable aggregation: ${this.disableAggregation}`);
    this.updateCollectionAttributes();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  private async updateCollectionAttributes() {
    if (this.disableAggregation) {
      this.logger.log('Not executing aggregation.');
      return;
    }

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
      await collection.save();

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

          tokenBatch.forEach(({ tokenId, metadata: { attributes } }) => {
            if (attributes && Array.isArray(attributes)) {
              attributes.forEach(({ trait_type, value }) => {
                traits[trait_type] = traits[trait_type] || {};
                traits[trait_type][value] = traits[trait_type][value] || [];
                traits[trait_type][value].push(tokenId);
              });
            }
          });
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
        await collection.save();

        throw e;
      }
    }
  }
}
