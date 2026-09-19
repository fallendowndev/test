const path = require('path');

const getFilePath = (file) => {
  if (!file) return null;
  return `/uploads/${file.filename}`;
};

const deleteFile = async (filePath) => {
  if (!filePath) return;

  const fs = require('fs').promises;
  const fullPath = path.join(__dirname, '..', filePath);

  try {
    await fs.unlink(fullPath);
  } catch (err) {
    console.warn(`Could not delete file ${fullPath}: ${err.message}`);
  }
};

module.exports = { getFilePath, deleteFile };
