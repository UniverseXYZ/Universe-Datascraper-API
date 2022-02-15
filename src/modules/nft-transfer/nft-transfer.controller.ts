import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetSingleTokenDto } from '../nft-token/dto/get-single-token.dto';
import { PaginationDto } from '../nft-token/dto/pagination.dto';
import { NFTTransferService } from './nft-transfer.service';

@Controller('transfers')
@ApiTags('Transfers')
export class NFTTransferController {
  constructor(private service: NFTTransferService) {}

  @Get(':contract/:tokenId')
  async getTransfersByTokenId(
    @Param() param: GetSingleTokenDto,
    @Query() query: PaginationDto,
  ) {
    const pageNum: number = query.page ? query.page - 1 : 0;
    const limit: number = query.size ? query.size : 10;
    return this.service.getTransferByTokenId(
      param.contract,
      param.tokenId,
      pageNum,
      limit,
    );
  }
}
