const { sequelize, Candidate, JobDescription } = require('./db');
const { originalDataStore } = require('./utils/piiStripper'); // We can't inject into the running server's memory, but we can seed DB

async function seedCandidates() {
  try {
    await sequelize.authenticate();
    
    // Find the active job description
    const job = await JobDescription.findOne({ where: { is_active: true } });
    if (!job) {
      console.log('No active job found to link candidates to.');
      process.exit(1);
    }

    const mockCandidates = [
      {
        candidate_code: 'A159',
        anonymised_text: "Experienced Full Stack Developer with 4 years counting creating web apps. Strong in React, Node.js, Next.js, and scaling APIs with MySQL and PostgreSQL. Worked in agile teams.",
        score: 11,
        rank: 1,
        explanation: JSON.stringify([
          { item: 'React', matched: true, points: 2 },
          { item: 'Node.js', matched: true, points: 2 },
          { item: 'MySQL', matched: true, points: 2 },
          { item: 'Javascript', matched: false, points: 0 },
          { item: 'Rest api', matched: false, points: 0 },
          { item: '4 years exp (min: 2)', matched: true, points: 3 },
          { item: 'Next.js', matched: true, points: 1 },
          { item: 'Postgresql', matched: true, points: 1 }
        ]),
        job_id: job.id
      },
      {
        candidate_code: 'B821',
        anonymised_text: "Junior developer. 1 year experience building UI with HTML, CSS, Javascript, and Vue. Familiar with Python for some backend scripting.",
        score: 3, // Javascript gives 2 points, 1 bonus point for Python, no exp points
        rank: 5,
        explanation: JSON.stringify([
          { item: 'React', matched: false, points: 0 },
          { item: 'Node.js', matched: false, points: 0 },
          { item: 'MySQL', matched: false, points: 0 },
          { item: 'Javascript', matched: true, points: 2 },
          { item: 'Rest api', matched: false, points: 0 },
          { item: '1 years exp (min: 2)', matched: false, points: 0 },
          { item: 'Python', matched: true, points: 1 }
        ]),
        job_id: job.id
      },
      {
        candidate_code: 'C305',
        anonymised_text: "Senior Software Engineer. I design scalable distributed architectures. 8 years experience. Excellent backend skills using Node.js, REST API design, and MySQL. Moving slowly into frontend using React.",
        score: 11,
        rank: 2,
        explanation: JSON.stringify([
          { item: 'React', matched: true, points: 2 },
          { item: 'Node.js', matched: true, points: 2 },
          { item: 'MySQL', matched: true, points: 2 },
          { item: 'Javascript', matched: false, points: 0 },
          { item: 'Rest api', matched: true, points: 2 },
          { item: '8 years exp (min: 2)', matched: true, points: 3 }
        ]),
        job_id: job.id
      },
      {
        candidate_code: 'D472',
        anonymised_text: "Backend Developer specializing in databases. 3 years experience writing optimize queries in MySQL and SQL Server. Good understanding of Javascript and REST APIs.",
        score: 7, 
        rank: 4,
        explanation: JSON.stringify([
          { item: 'React', matched: false, points: 0 },
          { item: 'Node.js', matched: false, points: 0 },
          { item: 'MySQL', matched: true, points: 2 },
          { item: 'Javascript', matched: true, points: 2 },
          { item: 'Rest api', matched: true, points: 2 },
          { item: '3 years exp (min: 2)', matched: true, points: 3 } // Wait, 3 yrs = 3 + 6 = 9 points. Let's fix score.
        ]),
        job_id: job.id
      },
      {
        candidate_code: 'E910',
        anonymised_text: "React Native developer aiming to switch to React.js. 2.5 years of professional work. Knows REST API consumption very well and JavaScript.",
        score: 8,
        rank: 3,
        explanation: JSON.stringify([
          { item: 'React', matched: true, points: 2 },
          { item: 'Node.js', matched: false, points: 0 },
          { item: 'MySQL', matched: false, points: 0 },
          { item: 'Javascript', matched: true, points: 2 },
          { item: 'Rest api', matched: true, points: 2 },
          { item: '2 years exp (min: 2)', matched: true, points: 3 }
        ]),
        job_id: job.id
      },
      {
        candidate_code: 'F624',
        anonymised_text: "Data analyst with strong problem-solving skills. Fresh graduate, no professional years experience yet. Skilled in Excel and reporting tools. Eager to learn web development.",
        score: 0,
        rank: 6,
        explanation: JSON.stringify([
          { item: 'React', matched: false, points: 0 },
          { item: 'Node.js', matched: false, points: 0 },
          { item: 'MySQL', matched: false, points: 0 },
          { item: 'Javascript', matched: false, points: 0 },
          { item: 'Rest api', matched: false, points: 0 },
          { item: '0 years exp (min: 2)', matched: false, points: 0 }
        ]),
        job_id: job.id
      }
    ];

    // Recalculate rank exactly based on score
    mockCandidates.forEach(c => {
        let total = 0;
        JSON.parse(c.explanation).forEach(item => total += item.points);
        c.score = total;
    });
    
    mockCandidates.sort((a,b) => b.score - a.score);
    mockCandidates.forEach((c, index) => c.rank = index + 1);

    await Candidate.bulkCreate(mockCandidates);
    console.log(`✅ Successfully seeded ${mockCandidates.length} mock candidates into the database!`);
    
    process.exit(0);
  } catch(e) {
    console.error('Error seeding test candidates:', e);
    process.exit(1);
  }
}

seedCandidates();
