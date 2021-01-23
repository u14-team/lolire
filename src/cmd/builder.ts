import { Lolire } from '../lolire';
import { Cmd } from './index';
import { CmdContext } from './processor';

export interface Command {
  name: string;
  description: string;
  handler: (ctx: CmdContext) => void;
}

export interface CommandArgument {
  slug: string;
  resolverSlug: string;
  required: boolean;
}

export interface BuildedCommand {
  name: string;
  description: string;
  usage?: string;
  args?: CommandArgument[];
  handler: (ctx: CmdContext) => void;
}

export class CmdBuilder {
  lolire: Lolire;
  cmd: Cmd;

  constructor(lolire: Lolire, cmd: Cmd) {
    this.lolire = lolire;
    this.cmd = cmd;
  }

  build(command: Command): BuildedCommand {
    const tokens = command.name.split(' ');
    const args: CommandArgument[] = [];
    const usage = [];
  
    tokens.slice(1).forEach(v => {
      const [slug, resolverSlug] = v.slice(1, v.length - 1).split(':');
      usage.push(`${v[0]}${slug}${v[v.length - 1]}`);
      args.push({
        required: v[0] === '<' && v[v.length - 1] === '>',
        resolverSlug,
        slug,
      });
    });

    return {
      name: tokens[0],
      description: command.description,
      handler: command.handler,
      usage: usage.length !== 0 && usage.join(' '),
      args
    };
  }
}