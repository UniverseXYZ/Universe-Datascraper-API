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
    return this.nftTokenService.getTokensByContract(contract, pageNum, limit);
  }
}
