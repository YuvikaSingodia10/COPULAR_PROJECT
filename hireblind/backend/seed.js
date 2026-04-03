const bcrypt = require('bcrypt');
require('dotenv').config();
const { sequelize, User, JobDescription } = require('./db');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    await sequelize.sync({ force: true });
    console.log('✅ Tables recreated.');

    // ─── Seed Users ───
    const adminPassword = await bcrypt.hash('demo123', 10);
    const recruiterPassword = await bcrypt.hash('demo123', 10);
    const seekerPassword = await bcrypt.hash('demo123', 10);

    await User.bulkCreate([
      { name: 'Admin User', email: 'admin@hireblind.com', password: adminPassword, role: 'admin' },
      { name: 'Recruiter User', email: 'recruiter@hireblind.com', password: recruiterPassword, role: 'recruiter' },
      { name: 'Job Seeker', email: 'seeker@hireblind.com', password: seekerPassword, role: 'jobseeker' }
    ]);
    console.log('✅ Users seeded.');

    // ─── Seed Job Description ───
    await JobDescription.create({
      title: 'Full Stack Developer',
      skills: 'React,Node.js,MySQL,JavaScript,REST API',
      min_experience: 2,
      is_active: true,
      created_by: 1
    });
    console.log('✅ Job description seeded.');

    console.log('\n🎉 Seed complete! You can now start the server.');
    console.log('   Login credentials:');
    console.log('   Admin:     admin@hireblind.com / demo123');
    console.log('   Recruiter: recruiter@hireblind.com / demo123');
    console.log('   Seeker:    seeker@hireblind.com / demo123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
