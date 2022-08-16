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
import { Utils } from 'src/utils';

@Injectable()
export class NftCollectionCronService {
  private logger: Logger;
  private disableAggregation: boolean;
  private isProcessing = false;
  private skippingCounter = 0;
  private readonly queryLimit: number;

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
    this.queryLimit = Number(this.configService.get('queryLimit')) || 10;
    this.logger.log(`Disable aggregation: ${this.disableAggregation}`);
    this.updateCollectionAttributes();
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  private async updateCollectionAttributes() {
    if (this.disableAggregation) {
      this.logger.log('Not executing aggregation.');
      return;
    }

    if (this.isProcessing) {
      if (
        this.skippingCounter <
        Number(this.configService.get('skippingCounterLimit'))
      ) {
        this.skippingCounter++;
        this.logger.log(
          `Collection attributes update is in process, skipping (${this.skippingCounter}) ...`,
        );
      } else {
        // when the counter reaches the limit, restart the pod.
        this.logger.log(
          `Skipping counter reached its limit. The process is not responsive, restarting...`,
        );
        Utils.shutdown();
      }
      return;
    }

    this.isProcessing = true;

    const collections = await this.nftCollectionsModel.find(
      {
        attributesUpdated: false,
      },
      {},
      {
        sort: { updatedAt: 1 },
        limit: this.queryLimit,
      },
    );

    this.logger.log(
      `Fetched ${this.queryLimit} collections. Starting to update attributes...`,
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
        this.logger.log(
          `Updating attributes for collection: ${collection.contractAddress} | Total NFTs: ${total}`,
        );
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
          this.logger.warn("Collection doesn't have attributes");
          continue;
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
        this.isProcessing = false;
        this.skippingCounter = 0;
      } catch (e) {
        collection.attributesUpdated = false;
        await collection.save();

        this.logger.error(e);

        this.isProcessing = false;
        this.skippingCounter = 0;

        throw e;
      }
    }
  }
}
