const { expect } = require("chai");
const { Api } = require('../lib/api/api');
const { ApiBuilder } = require('../lib/api/builder');

describe('API', () => {
  describe('builder', () => {
    const builder = new ApiBuilder({}, {});
    describe('.buildRequirement()', () => {
      it('Only type', () => {
        const result = builder.buildRequirement('account');
        expect(result).property('type', 'account');
        expect(result.data).a('array');
        expect(result).property('required', true);
      });

      it('Not required flag', () => {
        const result = builder.buildRequirement('#account');
        expect(result).property('required', false);
      });

      it('Param', () => {
        const result = builder.buildRequirement('p:myparam');
        expect(result).property('type', 'p');
        expect(result.data).property('slug', 'myparam');
        expect(result.data).property('argument', 'myparam');
        expect(result.data.type).a('undefined');
      });

      it('Param custom argument name', () => {
        const result = builder.buildRequirement('p:id@user');
        expect(result.data).property('slug', 'user');
        expect(result.data).property('argument', 'id');
      });

      it('Param custom resolver', () => {
        const result = builder.buildRequirement('p:userId:int');
        expect(result.data).property('type', 'int');
      });

      it('Param resolver === slug', () => {
        const result = builder.buildRequirement('p:user:.');
        expect(result.data).property('type', 'user');
      });

      it('Chain element', () => {
        const result = builder.buildRequirement('5<p:user:.');
        expect(result).property('depend', 5);
      });

      it('Chain last element', () => {
        const result = builder.buildRequirement('<p:user:.', 5);
        expect(result).property('depend', 4);
      });
    });
  });

  describe('main', () => {
    const builder = new ApiBuilder({}, {});
    describe('.on()', () => {
      it('Simple', () => {
        const api = new Api({});
        api.on({
          slug: 'testmethod',
          handler: ctx => 'ok'
        });
      });

      it('Requirements', () => {
        const api = new Api({});
        api.on({
          slug: 'testmethod',
          requirements: 'account 0<p:sample@test:.',
          handler: ctx => 'ok'
        });

        expect(api.methods.get('testmethod').requirements).length(2);
      });

      it('Execute', async () => {
        const api = new Api({
          log: console.log,
          warning: console.log
        });

        api.on({
          slug: 'testmethod',
          handler: ctx => 'ok'
        });

        const response = await api.processor.run({
          query: { method: 'testmethod' },
          request: { ip: '' }
        });

        expect(response).equals('ok');
      });
    });
  });
});