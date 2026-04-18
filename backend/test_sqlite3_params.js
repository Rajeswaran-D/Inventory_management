const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function test() {
  const db = await open({
    filename: ':memory:',
    driver: sqlite3.Database
  });
  
  await db.exec('CREATE TABLE test (id INTEGER, val TEXT, val2 TEXT)');
  
  // Try sequential parameters array with ?1, ?2
  await db.run('INSERT INTO test (id, val, val2) VALUES (?1, ?2, ?1)', [42, 'hello', 'world']);
  
  const row = await db.get('SELECT * FROM test');
  console.log(row);
}
test();
