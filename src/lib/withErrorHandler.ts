import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { ApiError } from "next/dist/server/api-utils";

function withErrorHandler(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return handler(req, res);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).send(error.message);
      } else {
        res.status(500).send({ error: "Internal server error" });
      }
    }
  };
}

export default withErrorHandler;
