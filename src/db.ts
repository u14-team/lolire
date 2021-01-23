import { Lolire } from './lolire';
import { Sequelize } from 'sequelize';

export class Db extends Sequelize {
  lolire: Lolire;

  constructor(lolire) {
    super(lolire.config.database, { logging: false });
    this.lolire = lolire;
  }

  async init() {
    try {
      await super.authenticate();
      this.lolire.logger.log('Connected to database.');
    } catch (err) {
      throw Error(`Database error: ${err.message}`);
    }
  }

  async safeSync(model) {
    // TODO: REWRITE

    await model.sync();
    const { options } = model;
    const queryInterface = model.QueryInterface;
    const tableName = model.getTableName(options);

    const columns = await queryInterface.describeTable(tableName);

    for (const columnName of Object.keys(model.tableAttributes)) {
      if (columns[columnName]) continue;

      const answer = await this.lolire.cmd.questionYN(`Добавить "${columnName}" в таблицу "${tableName}"`);
      if (answer) {
        this.lolire.logger.log(`Добавляю "${columnName}" в таблицу "${tableName}"...`);
        await queryInterface.addColumn(tableName, columnName, model.tableAttributes[columnName]);
      } else {
        this.lolire.logger.log('Пропускаю...');
      }
    }

    for (const columnName of Object.keys(columns)) {
      if (model.tableAttributes[columnName]) continue;

      const answer = await this.lolire.cmd.questionYN(`Удалить "${columnName}" из таблицы "${tableName}"`);
      if (answer) {
        this.lolire.logger.log(`Удаляю "${columnName}" из таблицы "${tableName}"...`);
        await queryInterface.removeColumn(tableName, columnName, options);
      } else {
        this.lolire.logger.log('Пропускаю...');
      }
    }
  }
}
