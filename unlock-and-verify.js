const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const dbPath = './data/sessionaudio.db';
const password = 'paddling-header-numerate';
const hash = '$2b$12$QFwRxvI/CN8Wbcv0ride1uAtJNT0PWjGRKQdRpCZEByp6W1Y87xre';

console.log('=== SessionAudio System Unlock and Verification ===\n');

// 1. Unlock the system
console.log('1. Unlocking system...');
const db = new Database(dbPath);
const result = db.prepare('DELETE FROM auth_attempts').run();
console.log(`   Cleared ${result.changes} failed login attempts\n`);

// 2. Verify password hash
console.log('2. Verifying password hash...');
console.log(`   Password: ${password}`);
console.log(`   Hash: ${hash}`);

bcrypt.compare(password, hash, (err, matches) => {
  if (err) {
    console.error('   ERROR:', err);
    db.close();
    process.exit(1);
  }

  console.log(`   Result: ${matches ? '✓ MATCHES' : '✗ DOES NOT MATCH'}\n`);

  if (!matches) {
    console.log('3. Generating correct hash...');
    bcrypt.hash(password, 12, (err, newHash) => {
      if (err) {
        console.error('   ERROR:', err);
        db.close();
        process.exit(1);
      }
      console.log(`   New hash: ${newHash}\n`);
      console.log('4. Update required:');
      console.log(`   Replace the PASSWORD_HASH in .env with the new hash above`);
      db.close();
    });
  } else {
    console.log('3. Password verification successful!');
    console.log('   System is now unlocked and ready to use.');
    db.close();
  }
});
