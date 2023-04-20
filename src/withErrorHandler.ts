import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

const withErrorHandler =
  (handler: NextApiHandler) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return handler(req, res);
    } catch (error) {
      if (error instanceof Error) {
        res.status(Number(error.cause) || 500).send(error.message);
      } else {
        res.status(500).send({ error: "Internal server error" });
      }
    }
  };

export default withErrorHandler;
