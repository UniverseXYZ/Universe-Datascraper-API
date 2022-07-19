import { Controller, Get, Param, Query, Logger, Patch } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import {
  NFTCollectionAttributes,
  NFTCollectionAttributesDocument,
} from 'datascraper-schema';
import { ethers } from 'ethers';
import { ContractAddressDto } from 'src/common/dto';
import { BaseController } from '../../common/base.controller';
import { NFTTokenOwnersService } from '../nft-token-owners/nft-token-owners.service';
import { NFTTokenService } from '../nft-token/nft-token.service';
import { NFTCollectionService } from './nft-collection.service';
import { Model } from 'mongoose';
import { isEmpty } from 'lodash';

@Controller('collections')
@ApiTags('Collections')
export class NFTCollectionController extends BaseController {
  constructor(
    private nftTokenService: NFTTokenService,
    private nftCollectionService: NFTCollectionService,
    private nftTokenOwnersService: NFTTokenOwnersService,
    @InjectModel(NFTCollectionAttributes.name)
    readonly nftCollectionAttributesModel: Model<NFTCollectionAttributesDocument>,
  ) {
    super(NFTCollectionController.name);
  }

  @Get(':contract')
  @ApiOperation({
    summary: 'Get collection data.',
  })
  async getCollection(@Param() params: ContractAddressDto) {
    return await this.nftCollectionService.getCollection(params.contract);
  }

  @Get(':contract/tokens')
  @ApiOperation({
    summary: 'Search for a particular token in a given collection.',
    description:
      'The endpoint requires a contract address and searches by name and attributes',
  })
  async getToken(@Param('contract') contract, @Query() query) {
    const { page, size, search, ...traits } = query;
    const pageNum: number = page ? Number(page) - 1 : 0;
    const limit: number = size ? Number(size) : 10;

    let tokenIds = null;

    const canSearchByTraits =
      !isEmpty(traits) &&
      Object.values(traits).filter((type) => !!type).length !== 0;

    if (canSearchByTraits) {
      tokenIds =
        await this.nftCollectionService.getTokenIdsByCollectionAttributes(
          contract,
          traits,
        );
    }

    const [tokens, count] = await Promise.all([
      this.nftTokenService.getTokensByContract(
        contract,
        pageNum,
        limit,
        search,
        tokenIds,
      ),
      this.nftTokenService.getCountByContract(contract, search, tokenIds),
    ]);
    if (!tokens.length) {
      return {
        page: pageNum,
        size: limit,
        total: count,
        data: [],
      };
    }
    const owners = await this.nftTokenOwnersService.getOwnersByTokens(tokens);
    const data = tokens.map((token) => {
      const ownersInfo = owners.filter(
        (owner) =>
          owner.contractAddress === token.contractAddress &&
          owner.tokenId === token.tokenId,
      );
      const ownerAddresses = ownersInfo.map((owner) => ({
        owner: owner.address,
        value: owner.value
          ? owner.value.toString()
          : ethers.BigNumber.from(owner.value).toString(),
      }));
      return {
        contractAddress: token.contractAddress,
        tokenId: token.tokenId,
        tokenType: token.tokenType,
        metadata: token.metadata,
        externalDomainViewUrl: token.externalDomainViewUrl,
        alternativeMediaFiles: token.alternativeMediaFiles,
        owners: [...ownerAddresses],
      };
    });
    return {
      page: pageNum,
      size: limit,
      total: count,
      data,
    };
  }

  @Get(':contract/more')
  @ApiOperation({
    summary: 'Fetch max 4 random nfts from the collection',
  })
  async getMoreFromCollection(
    @Param('contract') contract: string,
    @Query('maxCount') maxCount: number,
    @Query('excludeTokenId') excludeTokenId: string,
  ) {
    const tokens = await this.nftTokenService.getMoreFromCollection(
      contract,
      excludeTokenId,
      maxCount,
    );

    const owners = await this.nftTokenOwnersService.getOwnersByTokens(tokens);

    const data = tokens.map((token) => {
      const ownersInfo = owners.filter(
        (owner) =>
          owner.contractAddress === token.contractAddress &&
          owner.tokenId === token.tokenId,
      );
      const ownerAddresses = ownersInfo.map((owner) => ({
        owner: owner.address,
        value: owner.value
          ? owner.value.toString()
          : ethers.BigNumber.from(owner.value).toString(),
      }));
      return {
        contractAddress: token.contractAddress,
        tokenId: token.tokenId,
        tokenType: token.tokenType,
        metadata: token.metadata,
        externalDomainViewUrl: token.externalDomainViewUrl,
        alternativeMediaFiles: token.alternativeMediaFiles,
        owners: [...ownerAddresses],
      };
    });

    return data;
  }

  @Get('user/:owner')
  async getUserCollections(@Param('owner') address: string) {
    const collections = await this.nftTokenOwnersService.getUserCollections(
      address,
    );
    return this.nftCollectionService.getCollectionsByAddress(collections);
  }

  @Get('search/collections')
  async search(@Query('search') search) {
    return this.nftCollectionService.searchCollections(search);
  }

  @Patch(':contract/attributes')
  @ApiOperation({
    summary: 'Update nft-collection-attributes',
    description: `This endpoint is being regulary called by a cronjob in order to insert or update the attributes for each token in a given collecion.
       The newly created database collection is used by the nft-collection-controller (getTokens method) in order to get all the tokens that have a particular trait`,
  })
  async updateCollectionAttributes(@Param() params: ContractAddressDto) {
    return this.nftCollectionService.updateCollectionAttributes(
      params.contract,
    );
  }

  @Patch(':contract/refresh')
  @ApiOperation({
    summary: `Put all tokens inside a collection into the pool of tokens requiring metadata refresh.`,
    description: `This endpoint marks all tokens in a collection as needToRefresh = true which makes Metadata Producer to update these tokens\' metadata.
      Note that there\'s no guarantee when exactly Metadata Producer will pick up and update the marked tokens.
      It returns "OK" string if the DB operation has been successful.`,
  })
  @ApiParam({
    name: 'contract',
    description: 'Collection address.',
    type: String,
    required: true,
  })
  async refreshCollectionTokens(@Param() params: ContractAddressDto) {
    try {
      return await this.nftTokenService.refreshTokenDataByCollection(
        params.contract,
      );
    } catch (e) {
      this.logger.error(e);
      this.errorResponse(e);
    }
  }
}
