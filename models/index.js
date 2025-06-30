import sequelize from '../config/db.js';
import initUserModel from './User.js';

const User = initUserModel(sequelize);

const models = { User };

export { sequelize };
export default models;