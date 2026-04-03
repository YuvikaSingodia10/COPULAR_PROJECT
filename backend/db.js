const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './hireblind.sqlite',
  logging: false
});

// ─── User Model ───
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'recruiter'), allowNull: false },
  workspace_code: { type: DataTypes.STRING(10), allowNull: true }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// ─── JobDescription Model ───
const JobDescription = sequelize.define('JobDescription', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  skills: { type: DataTypes.TEXT, allowNull: false },
  min_experience: { type: DataTypes.INTEGER, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  workspace_code: { type: DataTypes.STRING(10), allowNull: true }
}, {
  tableName: 'job_descriptions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// ─── Candidate Model ───
const Candidate = sequelize.define('Candidate', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  candidate_code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  anonymised_text: { type: DataTypes.TEXT('long'), allowNull: true },
  score: { type: DataTypes.INTEGER, defaultValue: 0 },
  rank: { type: DataTypes.INTEGER, defaultValue: 0 },
  explanation: { type: DataTypes.JSON, allowNull: true },
  job_id: { type: DataTypes.INTEGER, allowNull: true },
  override_reason: { type: DataTypes.TEXT, allowNull: true },
  workspace_code: { type: DataTypes.STRING(10), allowNull: true }
}, {
  tableName: 'candidates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// ─── Application Model ───
const Application = sequelize.define('Application', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  job_id: { type: DataTypes.INTEGER, allowNull: false },
  candidate_code: { type: DataTypes.STRING(10), allowNull: true },
  status: {
    type: DataTypes.ENUM('under_review', 'shortlisted', 'not_selected'),
    defaultValue: 'under_review'
  }
}, {
  tableName: 'applications',
  timestamps: true,
  createdAt: 'applied_at',
  updatedAt: false
});

// ─── AuditLog Model ───
const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  action: { type: DataTypes.STRING(255), allowNull: false },
  candidate_code: { type: DataTypes.STRING(10), allowNull: true },
  performed_by: { type: DataTypes.INTEGER, allowNull: true },
  details: { type: DataTypes.TEXT, allowNull: true },
  workspace_code: { type: DataTypes.STRING(10), allowNull: true }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  createdAt: 'timestamp',
  updatedAt: false
});

// ─── Associations ───
JobDescription.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Candidate.belongsTo(JobDescription, { foreignKey: 'job_id', as: 'job' });
Application.belongsTo(User, { foreignKey: 'user_id', as: 'applicant' });
Application.belongsTo(JobDescription, { foreignKey: 'job_id', as: 'job' });
AuditLog.belongsTo(User, { foreignKey: 'performed_by', as: 'performer' });

module.exports = {
  sequelize,
  User,
  JobDescription,
  Candidate,
  Application,
  AuditLog
};
