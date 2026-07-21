/**
 * getAllFiles, returns file/folder paths from a directory.
 * @param {string} directory - Directory to scan
 * @param {boolean} [foldersOnly=false] - Return only folders
 * @returns {string[]} Absolute paths
 */

const fs = require('fs');
const path = require('path');

module.exports = (directory, foldersOnly = false) => {
  let fileNames = [];

  const files = fs.readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(directory, file.name);

    if (foldersOnly) {
      if (file.isDirectory()) fileNames.push(filePath);
    } else {
      if (file.isFile()) fileNames.push(filePath);
    }
  }

  return fileNames;
};