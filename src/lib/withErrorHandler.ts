import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { ApiError } from "next/dist/server/api-utils";

import {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} from "http-status-codes";

function withErrorHandler(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return await handler(req, res);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`${error.statusCode}/n${error.message}/n${error.stack}`);
      } else {
        console.error(`An unknown error occurred /n${JSON.stringify(error)}`);
      }
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };
}

export default withErrorHandler;
