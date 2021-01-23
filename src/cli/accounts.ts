import { Cmd } from "../cmd";
import { CmdContext } from "../cmd/processor";
import * as crypto from 'crypto';

export function initAccountsCli(cmd: Cmd) {
  cmd.on({
    name: 'adduser <login:word> [password:word]',
    description: 'Add a new user',
    handler: async (ctx: CmdContext) => {
      if (!ctx.params.password) {
        ctx.params.password = crypto.randomBytes(4).toString('hex');
        cmd.lolire.log(`Generated password: ${ctx.params.password}`);
      }
  
      await cmd.lolire.accountManager.createAccount(
        ctx.params.login,
        ctx.params.password
      );

      cmd.lolire.log(`Created account: ${ctx.params.login}`);
    }
  });
}
