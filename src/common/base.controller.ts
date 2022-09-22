import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { constants } from './constants';
import { DatascraperException } from './exceptions/DatascraperException';

/**
 * Base Controller class.
 */
export class BaseController {
  protected logger;

  constructor(name: string) {
    this.logger = new Logger(name);
  }

  /**
   * Returns successful API response.
   * @param {any} body
   * @returns {Object}
   */
  protected successResponse(body) {
    return body;
  }

  /**
   * Returns error API response.
   * If the error is an instance of DatascraperException,
   * the message will be sent to the client.
   * @param e
   * @param statusCode
   * @throws {HttpException}
   */
  protected errorResponse(e: Error) {
    let message = constants.GENERIC_ERROR;
    if (e instanceof DatascraperException) {
      message = e.message;
    }

    throw new HttpException(message, HttpStatus.BAD_REQUEST);
  }
}
