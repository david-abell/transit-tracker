import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import { ReasonPhrases, StatusCodes } from "http-status-codes";

import { ApiError } from "next/dist/server/api-utils";
import { Prisma } from "@prisma/client";

function withErrorHandler(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const result = await handler(req, res);

      return result;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientInitializationError) {
        // @ts-ignore
        console.log(e.message);
      } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // @ts-ignore
        console.log(e.code);
        console.log(e.message);
      } else if (e instanceof ApiError) {
        // console.error(
        //   `\nApi ${e.statusCode} error \nMessage: \n${e.message}\nStack:\n${e.stack}`
        // );
      } else if (e instanceof Error) {
        // console.error(
        //   `\nApi error \nMessage: \n${e.message}\nStack:\n${e.stack}`
        // );
        // @ts-ignore
      }

      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ReasonPhrases.INTERNAL_SERVER_ERROR
      );
      // return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      //   error: ReasonPhrases.INTERNAL_SERVER_ERROR,
      // });
    }
  };
}

export default withErrorHandler;
