import { Logger } from './logger';
import { Util } from './util';
import { Api } from './api/api';
import { Cmd } from './cmd';
import { Server } from './server';
import { Db } from './db';
import { AccountManager } from './accountManager';
// import * as updateNotifier from 'update-notifier';

export class Lolire {
  logger = new Logger();
  util = new Util();
  api = new Api(this);
  cmd = new Cmd(this);
  server = new Server(this);
  db: Db;
  accountManager = new AccountManager(this);

  log = this.logger.log;
  info = this.logger.info;
  warning = this.logger.warning;
  error = this.logger.error;

  shutdownCallbacks: (() => Promise<void>)[] = [];
  isShutdown = false;
  version: string = '0.1.0';
  options: any;
  config: any;
  core: any;

  async init(options) {
    this.options = options;
    this.config = options.config;
    this.core = options.core;
    
    this.logger.info(`Powered by Lolire V${this.version}.`);
    this.api.init();
    this.cmd.init();

    this.db = new Db(this);
    await this.db.init();
    await this.accountManager.init();

    process.on('SIGINT', () => this.shutdown());
  }

  async start() {
    await this.server.start();
    /*if (this.options.pkg) {
      const notifier = updateNotifier({ pkg: this.options.pkg, updateCheckInterval: 0 });
      console.log(notifier)
      if (!notifier.update) {
        return;
      }

      this.info(`New version available ${notifier.update.latest} (${notifier.update.current})`);
      this.info(`Use 'git pull' to update`);
    }*/
  }

  async shutdown(code = 0) {
    this.log('Closing Lolire...');
    this.isShutdown = true;
    await Promise.all(this.shutdownCallbacks.map(v => v()));
    process.exit(code);
  }

  onShutdown(cb) {
    this.shutdownCallbacks.push(cb);
  }
}