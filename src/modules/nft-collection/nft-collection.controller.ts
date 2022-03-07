import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContractAddressDto } from 'src/common/dto';
import { NFTTokenService } from '../nft-token/nft-token.service';
import { NFTCollectionService } from './nft-collection.service';

@Controller('collections')
@ApiTags('Collections')
export class NFTCollectionController {
  constructor(
    private nftTokenService: NFTTokenService,
    private nftCollectionService: NFTCollectionService,
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
  ) {
    const pageNum: number = page ? Number(page) - 1 : 0;
    const limit: number = size ? Number(size) : 10;
    const [tokens, count] = await Promise.all([
      this.nftTokenService.getTokensByContract(contract, pageNum, limit),
      this.nftTokenService.getCountByContract(contract),
    ]);
    return {
      page: pageNum,
      size: limit,
      total: count,
      data: tokens,
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
    const collections = await this.nftTokenService.getUserCollections(address);

    return this.nftCollectionService.getCollectionsByAddress(collections);
  }

  @Get('search')
  async search(@Query('search') search) {
    return this.nftCollectionService.searchCollections(search);
  }
}
