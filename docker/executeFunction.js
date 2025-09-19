const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

function executeFunction(language, code) {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const fileName = `${id}.${language === 'python' ? 'py' : 'js'}`;
    const filePath = path.join(__dirname, fileName);

    fs.writeFileSync(filePath, code);

    const image = language === 'python' ? 'lambda-python' : 'lambda-javascript';
    const command = `docker run --rm -v ${filePath}:/app/code.${language === 'python' ? 'py' : 'js'} ${image}`;

    exec(command, (error, stdout, stderr) => {
      fs.unlinkSync(filePath);
      if (error) {
        return reject(stderr || error.message);
      }
      resolve(stdout);
    });
  });
}

module.exports = executeFunction;

