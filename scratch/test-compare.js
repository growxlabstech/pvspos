const bcrypt = require('bcryptjs');

const hash = '$2b$12$mTi3bmQAv6IgLYCS5c1.aObL/QKQgSqZOyyMkbIfCQUKcZACpBRwu';
const password = 'admin123456';

async function main() {
  const result = await bcrypt.compare(password, hash);
  console.log('Comparison result for admin123456:', result);
  
  const result2 = await bcrypt.compare('admin123456 ', hash);
  console.log('Comparison result with trailing space:', result2);
}

main();
