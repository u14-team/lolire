import { Account } from '../../accountManager';
import { ApiError, Api } from '../api';
import * as passwordHash from 'password-hash';
import { ApiContext } from '../apiContext';

export default function initApi(api) {
  api.on({
    slug: 'auth',
    requirements: 'p:login p:password',
    handler: async (ctx: ApiContext) => {
      const account = await Account.findOne({ where: { login: ctx.data.login } });
      if (!account || !passwordHash.verify(ctx.data.password, account.hashedPassword)) {
        throw new ApiError('invalid_auth');
      }
    
      const session = await ctx.lolire.accountManager.createSession(
        ctx.data.login,
        ctx.connectionContext.request.ip
      );

      ctx.answer(session.token);
    }
  });

  api.on({
    slug: 'check',
    requirements: 'param:token',
    handler: async (ctx: ApiContext) => {
      try {
        const { account: { login, id } } = await ctx.assertAccount(ctx.data.token);
        ctx.answer({ status: 'valid', login, id });
      } catch (error) {
        console.log(error.stack)
        ctx.answer({ status: 'invalid' });
      }
    }
  });
}