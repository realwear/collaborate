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
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */`;

function addHeaderToFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content.startsWith(HEADER)) {
    fs.writeFileSync(filePath, HEADER + '\n' + content);
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

files.forEach((file) => {
  try {
    addHeaderToFile(file);
  } catch (e) {
    console.error(e);
  }
});
