import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ActivityHistoryEnum } from '../../common/constants/enums';
import { BaseController } from '../../common/base.controller';
import { GetSingleTokenDto } from '../nft-token/dto/get-single-token.dto';
import { PaginationDto } from '../nft-token/dto/pagination.dto';
import { NFTTransferService } from './nft-transfer.service';

@Controller('transfers')
@ApiTags('Transfers')
export class NFTTransferController extends BaseController {
  constructor(private nftTransferService: NFTTransferService) {
    super(NFTTransferController.name);
  }

  @Get(':contract/:tokenId')
  async getTransfersByTokenId(
    @Param() param: GetSingleTokenDto,
    @Query() query: PaginationDto,
  ) {
    const pageNum: number = query.page ? query.page - 1 : 0;
    const limit: number = query.size ? query.size : 10;
    const [transfers, count] = await Promise.all([
      this.nftTransferService.getTransferByTokenId(
        param.contract,
        param.tokenId,
        pageNum,
        limit,
      ),
      this.nftTransferService.getCountByTokenId(param.contract, param.tokenId),
    ]);
    return {
      page: pageNum,
      size: limit,
      total: count,
      data: transfers,
    };
  }

  @Get(':contract')
  @ApiOperation({
    summary: 'Returns activity history for collection.',
  })
  @ApiQuery({
    name: 'history',
    description:
      'Default value is "all". Allowed values: sales, mints, transfers.',
    type: String,
    required: false,
  })
  async getActivityHistory(
    @Param('contract') contract: string,
    @Query('history') history: string,
    @Query('page') page: string,
  ) {
    try {
      history = history ? history : ActivityHistoryEnum.ALL;
      return await this.nftTransferService.getActivityHistory(
        contract,
        history,
        Number(page),
      );
    } catch (e) {
      this.logger.error(e);
      this.errorResponse(e);
    }
  }
}
