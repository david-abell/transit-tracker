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
      let responseMessage;
      if (e instanceof Prisma.PrismaClientInitializationError) {
        console.info("\nPrismaClientInitializationError\n");
        console.error(e.message);
      } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P1001") {
          responseMessage =
            "Can't reach database server. Please try again later.";
          console.info("\nPrismaClientKnownRequestError\n");
          console.log(`Error code: ${e.code}\n${e.message}`);
        }
      } else if (e instanceof Error) {
        console.error(
          `\nApi error \nMessage: \n${e.message}\nStack:\n${e.stack}`
        );
      }

      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(responseMessage ?? ReasonPhrases.INTERNAL_SERVER_ERROR);
    }
  };
}

export default withErrorHandler;
