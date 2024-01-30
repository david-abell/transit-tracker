import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import { ReasonPhrases, StatusCodes } from "http-status-codes";

import { Prisma } from "@prisma/client";

function withErrorHandler(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const result = await handler(req, res);

      return result;
    } catch (e) {
      let responseMessage: string = ReasonPhrases.INTERNAL_SERVER_ERROR;
      if (e instanceof Prisma.PrismaClientInitializationError) {
        console.error("\nPrismaClientInitializationError:\n");
        console.error(e.message);

        responseMessage = "No response from database. Please try again later.";
      } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P1001") {
          console.error("\nPrismaClientKnownRequestError\n");
          console.error(`Error code: ${e.code}\n${e.message}`);

          responseMessage =
            "No response from database. Please try again later.";
        }
      } else if (e instanceof Error) {
        console.error(
          `\Unknown error: \nMessage: \n${e.message}\nStack:\n${e.stack}`
        );
      }

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: responseMessage,
      });
    }
  };
}

export default withErrorHandler;
