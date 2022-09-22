import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * DatascraperException class.
 * Always use this exception if you want the message to be sent to the client.
 */
export class DatascraperException extends HttpException {
  constructor(message = 'Bad Request') {
    super(
      {
        status: HttpStatus.BAD_REQUEST,
        error: 'Datascraper Exception',
        message: message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
