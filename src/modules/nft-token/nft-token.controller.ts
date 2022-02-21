import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetSingleTokenDto } from './dto/get-single-token.dto';
import { PaginationDto } from './dto/pagination.dto';
import { NFTTokenService } from './nft-token.service';

@Controller('tokens')
@ApiTags('Tokens')
export class NFTTokenController {
  constructor(private service: NFTTokenService) {}

  @Get()
  async getTokens(@Query() query: PaginationDto) {
    const pageNum: number = query.page ? query.page - 1 : 0;
    const limit: number = query.size ? query.size : 10;
    const [tokens, count] = await Promise.all([
      this.service.getTokens(pageNum, limit),
      this.service.getCount(),
    ]);
    return {
      page: pageNum,
      size: limit,
      total: count,
      data: tokens,
    };
  }

  @Get(':contract/:tokenId')
  async getToken(@Param() param: GetSingleTokenDto) {
    return this.service.getToken(param.contract, param.tokenId);
  }

  @Put('refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  async refreshToken(@Body() refreshTokenDto: GetSingleTokenDto) {
    await this.service.refreshTokenData(
      refreshTokenDto.contract,
      refreshTokenDto.tokenId,
    );
  }
}
