import { Lolire } from '../lolire';
import { CmdIo } from './io';
import { BuildedCommand, CmdBuilder, Command } from './builder';
import { CmdProcessor } from './processor';
import { initCli } from '../cli';

export class CommandError extends Error {}

export class Cmd {
  lolire: Lolire;
  io: CmdIo;
  builder: CmdBuilder;
  processor: CmdProcessor;

  commands = new Map<string, BuildedCommand>();

  constructor(lolire: Lolire) {
    this.lolire = lolire;
    this.io = new CmdIo(lolire, this);
    this.builder = new CmdBuilder(lolire, this);
    this.processor = new CmdProcessor(lolire, this);
  }

  init() {
    this.processor.init();
    initCli(this);
  }

  on(options: Command) {
    const builded = this.builder.build(options);
    this.commands.set(builded.name, builded);
  }

  question(str) {
    return new Promise(resolve => this.io.rl.question(str, resolve));
  }

  async questionYN(str) {
    const response = await this.question(`${str}? [y/n] `);
    return response === 'y';
  }
}
