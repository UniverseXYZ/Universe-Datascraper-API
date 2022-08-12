import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  NFTTransferHistory,
  NFTTransferHistoryDocument,
} from './schema/nft-transfer.schema';
import { utils, constants as ethersConstants } from 'ethers';
import { constants } from '../../common/constants';
import { DatascraperException } from '../../common/exceptions/DatascraperException';
import { ActivityHistoryEnum } from '../../common/constants/enums';

@Injectable()
export class NFTTransferService {
  constructor(
    @InjectModel(NFTTransferHistory.name)
    private readonly nftTransferModel: Model<NFTTransferHistoryDocument>,
  ) {}

  public async getTransferByTokenId(
    contractAddress: string,
    tokenId: string,
    page: number,
    limit: number,
  ): Promise<NFTTransferHistoryDocument[]> {
    return await this.nftTransferModel
      .find({ contractAddress, tokenId })
      .sort({ blockNum: 1 })
      .skip(page * limit)
      .limit(limit);
  }

  public async getCountByTokenId(
    contractAddress: string,
    tokenId: string,
  ): Promise<number> {
    return await this.nftTransferModel.count({ contractAddress, tokenId });
  }

  public async getTransferByUserAddress(
    userAddress: string,
    page: number,
    limit: number,
  ): Promise<NFTTransferHistoryDocument[]> {
    return await this.nftTransferModel
      .find({ $or: [{ to: userAddress }, { from: userAddress }] })
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit);
  }

  public async getCountByUserAddress(userAddress: string): Promise<number> {
    return await this.nftTransferModel.count({
      $or: [{ to: userAddress }, { from: userAddress }],
    });
  }

  /**
   * Returns activity (transfers) history for collection.
   * Supports pagination.
   * @param contractAddress
   * @param history - ActivityHistoryEnum
   * @param page
   * @returns {Promise<any>} - an object with {page, size, total, data}
   */
  public async getActivityHistory(
    contractAddress: string,
    history: ActivityHistoryEnum,
    page: number,
  ): Promise<any> {
    if (!constants.REGEX_ETHEREUM_ADDRESS.test(contractAddress)) {
      throw new DatascraperException(constants.INVALID_CONTRACT_ADDRESS);
    }
    if (!(<any>Object).values(ActivityHistoryEnum).includes(history)) {
      throw new DatascraperException(constants.INVALID_HISTORY);
    }

    const limit = constants.DEFAULT_PAGE_SIZE;
    page = page > 1 ? page - 1 : 0;

    const transferFilter: any = {
      contractAddress: utils.getAddress(contractAddress.toLowerCase()),
    };
    const lookupSales: any = [];
    const lookupSalesAfterPagination: any = [];

    switch (history) {
      case ActivityHistoryEnum.SALES:
        lookupSales.push({
          $lookup: {
            from: constants.MARKETPLACE_ORDERS,
            let: {
              matchedTxHash: '$hash',
            },
            pipeline: [
              {
                $match: {
                  matchedTxHash: { $type: 'array' },
                },
              },
              { $unwind: '$matchedTxHash' },
              {
                $addFields: {
                  txData: { $objectToArray: '$matchedTxHash' },
                },
              },
              {
                $addFields: {
                  txHash: { $first: '$txData' },
                },
              },
              {
                $addFields: {
                  thatFreakingHash: '$txHash.k',
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ['$thatFreakingHash', '$$matchedTxHash'],
                  },
                },
              },
            ],
            as: 'sales',
          },
        });
        lookupSales.push({
          $match: {
            sales: { $ne: [] },
          },
        });
        break;
      case ActivityHistoryEnum.MINTS:
        transferFilter.from = ethersConstants.AddressZero;
        break;
      case ActivityHistoryEnum.TRANSFERS:
        transferFilter.from = {
          $ne: ethersConstants.AddressZero,
        };
        lookupSales.push({
          $lookup: {
            from: constants.MARKETPLACE_ORDERS,
            let: {
              matchedTxHash: '$hash',
            },
            pipeline: [
              {
                $match: {
                  matchedTxHash: { $type: 'array' },
                },
              },
              { $unwind: '$matchedTxHash' },
              {
                $addFields: {
                  txData: { $objectToArray: '$matchedTxHash' },
                },
              },
              {
                $addFields: {
                  txHash: { $first: '$txData' },
                },
              },
              {
                $addFields: {
                  thatFreakingHash: '$txHash.k',
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ['$thatFreakingHash', '$$matchedTxHash'],
                  },
                },
              },
            ],
            as: 'sales',
          },
        });
        lookupSales.push({
          $match: {
            sales: [],
          },
        });
        break;
      case ActivityHistoryEnum.ALL:
      default:
        lookupSalesAfterPagination.push({
          $lookup: {
            from: constants.MARKETPLACE_ORDERS,
            let: {
              matchedTxHash: '$hash',
            },
            pipeline: [
              {
                $match: {
                  matchedTxHash: { $type: 'array' },
                },
              },
              { $unwind: '$matchedTxHash' },
              {
                $addFields: {
                  txData: { $objectToArray: '$matchedTxHash' },
                },
              },
              {
                $addFields: {
                  txHash: { $first: '$txData' },
                },
              },
              {
                $addFields: {
                  thatFreakingHash: '$txHash.k',
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ['$thatFreakingHash', '$$matchedTxHash'],
                  },
                },
              },
            ],
            as: 'sales',
          },
        });
        break;
    }

    const [activityHistory, count] = await Promise.all([
      this.nftTransferModel.aggregate([
        {
          $match: transferFilter,
        },
        {
          $sort: { blockNum: -1 },
        },
        ...lookupSales, // that goes before pagination!
        { $skip: page * limit },
        { $limit: limit },
        {
          $lookup: {
            from: 'nft-tokens',
            let: {
              contractAddress: utils.getAddress(contractAddress.toLowerCase()),
              tokenId: '$tokenId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ['$tokenId', '$$tokenId'],
                      },
                      {
                        $eq: ['$contractAddress', '$$contractAddress'],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  alternativeMediaFiles: 1,
                  metadata: 1,
                },
              },
            ],
            as: 'metadata',
          },
        },
        ...lookupSalesAfterPagination,
      ]),
      this.nftTransferModel.aggregate([
        {
          $match: transferFilter,
        },
        ...lookupSales,
        { $count: 'count' },
      ]),
    ]);

    return {
      page: page + 1,
      size: limit,
      total: count[0]?.count || 0,
      data: activityHistory,
    };
  }
}
