import { Lolire } from '../lolire';
import { Api, ApiMethodInterface, BuildedApiMethodInterface, ApiRequirement } from './api';

export class ApiBuilder {
  lolire: Lolire;
  api: Api;

  constructor(lolire: Lolire, api: Api) {
    this.lolire = lolire;
    this.api = api;
  }

  build(method: ApiMethodInterface): BuildedApiMethodInterface {
    return {
      ...method,
      requirements: method.requirements && this.buildRequirements(method.requirements)
    };
  }

  buildRequirements(requirements: string): ApiRequirement[] {
    return requirements.split(' ').map((v, i) => this.buildRequirement(v, i));
  }

  buildRequirement(requirement: string, index: number): ApiRequirement {
    const [typePart, ...data] = requirement.split(':');
    const type = typePart.match(/([a-zA-Z]+)/)[0];
    const flags = typePart.substring(0, typePart.indexOf(type));
    const isDepend = flags.includes('<');
    const dependInt = parseInt(flags.substring(0, flags.indexOf('<')));

    return {
      required: !flags.includes('#'),
      type,
      data: type === 'p' ? this.parseParamData(data) : data,
      depend: isDepend && (Number.isNaN(dependInt) ? index - 1 : dependInt)
    };
  }

  parseParamData([namePart, typePart]: string[]) {
    const [argument, slugPart] = namePart.split('@');
    const slug = slugPart || argument;
    return {
      type: typePart === '.' ? slug : typePart,
      slug,
      argument
    };
  }
}