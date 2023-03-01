const { unlink, existsSync } = require("fs");

exports.deleteFile = (filePath) => {
  if (!existsSync(filePath)) return;
  unlink(filePath, (error) => {
    if (error) throw error;
  });
};
