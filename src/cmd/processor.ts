import { Lolire } from '../lolire';
import { Cmd, CommandError } from './index';
import { BuildedCommand } from './builder';

export interface CmdContextOptions {
  lolire: Lolire;
  input: string;
  args: string[];
  params?: any;
}

export class CmdContext {
  lolire: Lolire;
  input: string;
  args: string[];
  params?: any;

  constructor(options: CmdContextOptions) {
    Object.assign(this, options);
  }

  assert(condition: boolean, message: string) {
    if (condition) {
      return;
    }

    throw new CommandError(message);
  }
}

export class CmdProcessor {
  lolire: Lolire;
  cmd: Cmd;

  typeResolvers = new Map<string, (entity: string, index: number, args: string[]) => any>();

  constructor(lolire: Lolire, cmd: Cmd) {
    this.lolire = lolire;
    this.cmd = cmd;
  }

  init() {
    this.add('string', (_, index: number, args: string[]) => args.slice(index).join(' '));
    this.add('word', (arg: string) => arg);
    this.add('int', (arg: string) => parseInt(arg));
    this.add('float', (arg: string) => parseFloat(arg));
  }

  add(slug: string, handler: (arg: string, index: number, args: string[]) => any) {
    this.typeResolvers.set(slug, handler);
  }

  getResolver(slug: string) {
    const resolver = this.typeResolvers.get(slug);
    if (!resolver) {
      throw Error(`Resolver '${slug}' not found`);
    }

    return resolver;
  }

  async parseParams(command: BuildedCommand, args: string[]) {
    if (!command.args) {
      return;
    }

    const params = {};
    let tokenIndex = 0;
    for (let i = 0; i < command.args.length; i++) {
      const arg = command.args[i];

      try {
        const resolver = this.getResolver(arg.resolverSlug);
        params[arg.slug] = await resolver(args[tokenIndex], tokenIndex, args);
      } catch(error) {
        if (!arg.required) {
          continue;
        }

        throw new CommandError(`Param '${arg.slug}' is invalid:\n${error.message}`);
      } finally {
        tokenIndex++;
      }
    }

    return params;
  }

  async run(input: string) {
    const args = input.split(' ');
    const command = this.cmd.commands.get(args[0]);
    if (!command) {
      return this.fallback(args[0]);
    }

    const ctx = new CmdContext({
      lolire: this.lolire,
      params: await this.parseParams(command, args.slice(1)),
      input,
      args
    });

    return command.handler(ctx);
  }

  fallback(commandName: string) {
    this.lolire.log(`Command '${commandName}' not found.`);
    this.lolire.log('Type \'help\' to list commands.');
  }
}