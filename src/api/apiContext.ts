import { Lolire } from '../lolire';
import { ApiError } from './api';
import { Session, Account } from '../accountManager';

export class ApiContext {
  lolire: Lolire;
  params: any;
  connectionContext: any;
  data?: any;

  constructor(lolire, params, connectionContext) {
    this.lolire = lolire;
    this.params = params;
    this.connectionContext = connectionContext;
  }

  answer(response) {
    this.connectionContext.body = { response };
  }

  async assertParam(param: string, resolver: (ctx: ApiContext, param: string) => any = null, required = true) {
    const value = resolver ? await resolver(this, this.params[param]) : this.params[param];
    if (!value && required) {
      throw new ApiError('invalid_param', { param });
    }

    return value;
  }
  
  async assertAccount(token = null) {
    if (!token)
      token = await this.assertParam('token');
    const session = await Session.findOne({ where: { token } });
    if (!session || !session.isLive(this.lolire)) {
      throw new ApiError('invalid_token', { token });
    }

    if (session.ip !== this.connectionContext.request.ip) {
      throw new ApiError('invalid_token_ip', { ip: this.connectionContext.request.ip });
    }

    const account = await Account.findOne({ where: { login: session.login } });
    if (!account) {
      throw new ApiError('internal_error');
    }

    await session.use();
    return { session, account };
  }
}