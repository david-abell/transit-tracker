import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { ApiError } from "next/dist/server/api-utils";

const withErrorHandler =
  (handler: NextApiHandler) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return handler(req, res);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).send(error.message);
      } else {
        res.status(500).send({ error: "Internal server error" });
      }
    }
  };

export default withErrorHandler;
