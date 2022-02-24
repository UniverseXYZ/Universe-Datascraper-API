import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NFTTokenService } from '../nft-token/nft-token.service';

@Controller('collections')
@ApiTags('Collections')
export class NFTCollectionController {
  constructor(private nftTokenService: NFTTokenService) {}

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

  @Get(':owner')
  async getUserCollections(@Param('owner') address: string) {
    return this.nftTokenService.getUserCollections(address);
  }
}
