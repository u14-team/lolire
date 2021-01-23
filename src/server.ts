import * as Koa from 'koa';
import * as Router from 'koa-router';
import { Lolire } from './lolire';
import { ApiError } from './api/api';
import * as cors from '@koa/cors';
import { Server as HttpServer } from 'http';
import { WsServer } from './wsServer';


export class Server {
  lolire: Lolire;
  ws: WsServer;
  app = new Koa();
  router = new Router();
  server: HttpServer;

  constructor(lolire: Lolire) {
    this.lolire = lolire;
    this.ws = new WsServer(lolire);
  }

  start() {
    this.router.get('/', ctx => this.lolire.api.processor.run(ctx));

    this.app.proxy = true;
    this.app
      .use(cors())
      .use(this.lolirendleError.bind(this))
      .use(this.router.routes())
      .use(this.router.allowedMethods());

    this.server = new HttpServer(this.app.callback());
    this.ws.start();
    this.server.listen(this.lolire.config.port);
  }

  async lolirendleError(ctx, next) {
    try {
      await next();
    } catch(error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      ctx.body = { error: { slug: error.slug, data: error.data } };
    }
  }
}