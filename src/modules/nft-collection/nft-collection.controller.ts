import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ethers } from 'ethers';
import { ContractAddressDto } from 'src/common/dto';
import { NFTTokenOwnersService } from '../nft-token-owners/nft-token-owners.service';
import { NFTTokenService } from '../nft-token/nft-token.service';
import { NFTCollectionService } from './nft-collection.service';

@Controller('collections')
@ApiTags('Collections')
export class NFTCollectionController {
  private readonly logger = new Logger(NFTCollectionController.name)
  constructor(
    private nftTokenService: NFTTokenService,
    private nftCollectionService: NFTCollectionService,
    private nftTokenOwnersService: NFTTokenOwnersService,
  ) {}

  @Get(':contract')
  @ApiOperation({
    summary: 'Get collection data.',
  })
  async getCollection(@Param() params: ContractAddressDto) {
    return await this.nftCollectionService.getCollection(params.contract);
  }

  @Get(':contract/tokens')
  async getToken(
    @Param('contract') contract,
    @Query('page') page,
    @Query('size') size,
    @Query('search') search,
  ) {
    const pageNum: number = page ? Number(page) - 1 : 0;
    const limit: number = size ? Number(size) : 10;
    const [tokens, count] = await Promise.all([
      this.nftTokenService.getTokensByContract(
        contract,
        pageNum,
        limit,
        search,
      ),
      this.nftTokenService.getCountByContract(contract, search),
    ]);

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
    return this.nftTokenService.getMoreFromCollection(
      contract,
      excludeTokenId,
      maxCount,
    );
  }

  @Get('user/:owner')
  async getUserCollections(@Param('owner') address: string) {
    const collections = await this.nftTokenOwnersService.getUserCollections(address);
    return this.nftCollectionService.getCollectionsByAddress(collections);
  }

  @Get('search')
  async search(@Query('search') search) {
    return this.nftCollectionService.searchCollections(search);
  }
}
