import { Lolire } from './lolire';
import * as Sequelize from 'sequelize';
import * as crypto from 'crypto';
import * as passwordHash from 'password-hash';

export class Account extends Sequelize.Model {
  login: string;
  hashedPassword: string;
}

export class Session extends Sequelize.Model {
  login: string;
  lastUsage: number;
  token: string;
  ip: string;

  isLive(lolire: Lolire) {
    return Date.now() / 1000 < this.lastUsage + lolire.config.sessionLife;
  }

  use(autoSave = true) {
    this.lastUsage = Math.floor(Date.now() / 1000);

    if (autoSave) {
      return this.save();
    }
  }
}

export class AccountManager {
  lolire: Lolire;

  constructor(lolire: Lolire) {
    this.lolire = lolire;
  }

  async init() {
    Account.init({
      login: Sequelize.STRING,
      hashedPassword: Sequelize.STRING,
      rights: Sequelize.JSONB,
      values: Sequelize.JSONB
    }, { sequelize: this.lolire.db, modelName: 'account' });

    Session.init({
      login: Sequelize.STRING,
      lastUsage: Sequelize.INTEGER,
      token: Sequelize.STRING,
      ip: Sequelize.STRING
    }, { sequelize: this.lolire.db, modelName: 'session' });

    await this.lolire.db.safeSync(Account);
    await this.lolire.db.safeSync(Session);
  }

  createSession(login, ip) {
    return Session.create({
      lastUsage: Math.floor(Date.now() / 1000),
      token: crypto.randomBytes(16).toString('hex'),
      login,
      ip
    });
  }
  
  async createAccount(login, password) {
    if (await Account.findOne({ where: { login } })) {
      throw Error('A user with this login already exists');
    }

    return Account.create({
      rights: [],
      values: {},
      hashedPassword: passwordHash.generate(password),
      login
    });
  }
}