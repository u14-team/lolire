import { Lolire } from '../lolire';
import * as readline from 'readline';
import { Cmd } from './index';

export class CmdIo {
  lolire: Lolire;
  cmd: Cmd;

  rl: readline.Interface;

  constructor(lolire: Lolire, cmd: Cmd) {
    this.lolire = lolire;
    this.cmd = cmd;
  
    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    this.rl.on('line', input => this.cmd.processor.run(input));
  }
}