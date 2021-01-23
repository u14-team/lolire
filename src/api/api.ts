import { Lolire } from '../lolire';
import { ApiContext } from './apiContext';

import initAuthGroup from './groups/auth';
import initOtherGroup from './groups/other';
import { ApiBuilder } from './builder';
import { ApiProcessor } from './processor';

export class ApiError extends Error {
  slug: string;
  data: any;

  constructor(slug: string, data: any = null) {
    super(slug);
    this.slug = slug;
    this.data = data;
  }
}

export interface ApiRequirement {
  type: string;
  data?: any;
  required: boolean;
  depend?: number;
}

export type ApiHandler = (ctx: ApiContext) => void;

export interface ApiMethodInterface {
  slug: string;
  requirements?: string;
  handler: ApiHandler;
}

export interface BuildedApiMethodInterface {
  slug: string;
  requirements?: ApiRequirement[];
  handler: ApiHandler;
}

export class Api {
  lolire: Lolire;
  builder: ApiBuilder;
  processor: ApiProcessor;

  methods = new Map<string, BuildedApiMethodInterface>();

  constructor(lolire: Lolire) {
    this.lolire = lolire;
    this.builder = new ApiBuilder(this.lolire, this);
    this.processor = new ApiProcessor(this.lolire, this);
  }

  init() {
    initAuthGroup(this);
    initOtherGroup(this);
    this.lolire.options.initApi(this);
  }

  on(options: ApiMethodInterface) {
    this.methods.set(options.slug, this.builder.build(options));
  }

  buildRequirements(requirements: string[]) {
    return requirements.map(v => {
      const [type, ...data] = v.split(':');
      const required = type.startsWith('#');

      return {
        type: required ? type.substring(1) : type,
        required,
        data
      };
    })
  }
}