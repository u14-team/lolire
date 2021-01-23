import { Cmd } from "../cmd";
import { CmdContext } from "../cmd/processor";

export function initMainCli(cmd: Cmd) {
  cmd.on({
    name: 'help',
    description: 'list all commands',
    handler: (ctx: CmdContext) => {
      const commands = [ ...cmd.commands.values() ].map(v =>
        `● ${v.name}${v.usage ? ` ${v.usage}` : ''} - ${v.description}`
      );

      ctx.lolire.log(`All command:\n${commands.join('\n')}`)
    }
  });

  cmd.on({
    name: 'exit',
    description: 'Closes the Lolire application',
    handler: (ctx: CmdContext) => {
      process.kill(process.pid, 'SIGINT');
    }
  });
}