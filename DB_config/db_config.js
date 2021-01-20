const Sequelize = require('sequelize');

const sequelize = new Sequelize({
    database: 'snip',
    username: 'root',
    password: 'test123',
    dialect: 'mysql',
  });


export default sequelize;