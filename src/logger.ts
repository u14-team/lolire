import * as chalk from 'chalk';

export class Logger {
  logFormat: string = chalk`{green [LOG]} `;
  warningFormat: string = chalk`{yellow [WRN]} - {yellow ⚠} `;
  errorFormat: string = chalk`{red [ERR]} - {red ❗} `;
  infoFormat: string = chalk`{blue [INF]} `;

  constructor() {
    this.log = this.log.bind(this);
    this.info = this.info.bind(this);
    this.warning = this.warning.bind(this);
    this.error = this.error.bind(this);
  }

  writeLine(str: string) {
    process.stdout.write(`${str}\n`);
  }

  log(message: string) {
    this.writeLine(this.logFormat + message);
  }

  warning(message: string) {
    this.writeLine(this.warningFormat + message);
  }

  error(message: string) {
    process.stdout.write(`${this.errorFormat}${message}\n`);
  }

  info(message: string) {
    this.writeLine(this.infoFormat + message);
  }
}
