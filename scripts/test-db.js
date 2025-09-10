const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'prisma', 'geza.db');

// Create/connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('✅ Connected to SQLite database at', dbPath);
  
  // Create table
  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      name TEXT,
      email TEXT,
      phone TEXT,
      intent TEXT,
      timeframe TEXT,
      budget TEXT,
      message TEXT,
      user_agent TEXT,
      ip TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
      return;
    }
    console.log('✅ Table "leads" created or already exists');
    
    // Test insert
    db.run(
      'INSERT INTO leads (id, name, email, message) VALUES (?, ?, ?, ?)',
      ['test-123', 'Test User', 'test@example.com', 'Test message'],
      function(err) {
        if (err) {
          console.error('Error inserting test data:', err.message);
          return;
        }
        console.log('✅ Test data inserted with ID:', this.lastID);
        
        // Test select
        db.get('SELECT COUNT(*) as count FROM leads', [], (err, row) => {
          if (err) {
            console.error('Error counting rows:', err.message);
            return;
          }
          console.log(`✅ Found ${row.count} rows in leads table`);
          
          // Close the database connection
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err.message);
              return;
            }
            console.log('✅ Database connection closed');
          });
        });
      }
    );
  });
});
