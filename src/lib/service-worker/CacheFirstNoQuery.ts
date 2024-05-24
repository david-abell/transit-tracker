import { Strategy, StrategyHandler } from "serwist";

export class CacheFirstNoQuery extends Strategy {
  async _handle(request: Request, handler: StrategyHandler): Promise<Response> {
    let cacheRequest;

    if (request.url.includes("openstreetmap")) {
      cacheRequest = new Request(new URL(request.url).href, {
        headers: request.headers,
        method: request.method,
        mode: request.mode,
      });
    }

    let response = await handler.cacheMatch(cacheRequest ?? request);
    let error;

    if (!response) {
      try {
        response = await handler.fetchAndCachePut(cacheRequest ?? request);
      } catch (err) {
        if (err instanceof Error) {
          error = err.message;
        }
      }
    }

    if (!response) {
      throw new Error(`no-response: ${request.url}\nmessage: ${error ?? ""}`);
    }

    return response;
  }
}
