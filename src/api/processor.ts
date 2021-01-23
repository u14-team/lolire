import { Lolire } from "../lolire";
import { Api, ApiError, ApiRequirement } from "./api";
import { ApiContext } from "./apiContext";

export class ApiProcessor {
  lolire: Lolire;
  api: Api;

  typeResolvers = new Map<string, (ctx: ApiContext, param: string) => any>();

  constructor(lolire: Lolire, api: Api) {
    this.lolire = lolire;
    this.api = api;

    this.add('string', arg => arg);
  }

  add(slug: string, handler: (arg: string) => any) {
    this.typeResolvers[slug] = handler;
  }

  getResolver(slug: string) {
    const resolver = this.typeResolvers[slug];
    if (!resolver) {
      throw Error(`Resolver '${slug}' not found`);
    }

    return resolver;
  }

  async runRequirement(ctx: ApiContext, requirement: ApiRequirement) {
    try {
      switch(requirement.type) {
        case 'account':
          const { account, session } = await ctx.assertAccount();
          ctx.data.account = account;
          ctx.data.session = session;
          break;
        case 'p':
          const { slug, type, argument } = requirement.data;
          const resolver = type && this.getResolver(type);
          ctx.data[slug] = await ctx.assertParam(argument, resolver, requirement.required);
          if (ctx.data[slug] === undefined && requirement.required) {
            throw new ApiError('invalid_param', {
              param: argument,
              type: type || 'string'
            });
          }

          break;
      }
    } catch(error) {
      if (!(error instanceof Error)) {
        this.lolire.error(`API:REQ:${requirement.type}:\n${error.stack}`);
        throw new ApiError('internal_error');
      }

      throw error;
    }
  }

  async runRequirements(ctx: ApiContext, requirements: ApiRequirement[]) {
    ctx.data = {};
    for (let i = 0; i < requirements.length; i++) {
      await this.runRequirement(ctx, requirements[i]);
    }
  }

  async run(ctx) {
    const method = this.api.methods.get(ctx.query.method);
    if (!method) {
      this.lolire.warning(`${ctx.request.ip} > ${ctx.query.method}`);
      throw new ApiError('invalid_method', { method: ctx.query.method });
    }

    this.lolire.log(`${ctx.request.ip} > ${ctx.query.method}`);
    const context = new ApiContext(this.lolire, ctx.query, ctx);

    if (method.requirements) {
      await this.runRequirements(context, method.requirements);
    }

    return method.handler(context);
  }
}