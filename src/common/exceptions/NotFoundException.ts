import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
  constructor(message = 'Not Found') {
    super(
      {
        status: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: message,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
