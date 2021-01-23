import { Api } from "../api";
import { ApiContext } from "../apiContext";

export default function initApi(api: Api) {
  api.on({
    slug: 'test',
    handler: (ctx: ApiContext) => {
      ctx.answer('ok');
    }
  });

  api.on({
    slug: 'methods',
    handler: (ctx: ApiContext) => {
      ctx.answer([...api.methods.keys()]);
    }
  });
}