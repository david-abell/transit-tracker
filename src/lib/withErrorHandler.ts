import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { ApiError } from "next/dist/server/api-utils";

function withErrorHandler(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return await handler(req, res);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).send(error.message);
      } else {
        res.status(500).send({ error: "Internal server error" });
      }
    }
  };
}

export default withErrorHandler;
