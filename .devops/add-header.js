const fs = require('fs');
const { glob } = require('glob');

const globPattern = process.argv[2];
if (!globPattern) {
  console.error('Please provide a glob pattern as the first argument');
  process.exit(1);
}

const HEADER = `/**
 * Copyright (C) 2024 RealWear, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */`;

function addHeaderToFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content.startsWith(HEADER)) {
    fs.writeFileSync(filePath, HEADER + "\n" + content);
    console.log(`Header added to: ${filePath}`);
  }
}

console.log(`Adding header to files matching: ${globPattern}`);

const files = glob.sync(globPattern, (err, files) => {
  if (err) {
    console.error('Error finding files:', err);
    process.exit(1);
  }
});

files.forEach(file => {
  try {
    addHeaderToFile(file);
  }
  catch (e) {
    console.error(e);
  }
})