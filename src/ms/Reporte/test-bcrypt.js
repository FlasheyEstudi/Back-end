const bcrypt = require('bcrypt');

const password = 'admin123';
const storedHash = '$2b$10$NEYdg0mil9rXhkRfioj9eewbifgBd3zwr269C/FrT6Qhimnx4Y6AK';

bcrypt.compare(password, storedHash, (err, result) => {
  console.log('Resultado de validación:', result);
  if (err) console.error('Error:', err);
});