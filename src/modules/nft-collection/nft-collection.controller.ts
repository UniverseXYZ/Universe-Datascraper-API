import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NFTTokenService } from '../nft-token/nft-token.service';
import { NFTCollectionService } from './nft-collection.service';

@Controller('collections')
@ApiTags('Collections')
export class NFTCollectionController {
  constructor(
    private nftTokenService: NFTTokenService,
    private nftCollectionService: NFTCollectionService,
  ) {}

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
