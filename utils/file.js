const { unlink } = require("fs");

exports.deleteFile = (filePath) => {
  unlink(filePath, (error) => {
    if (error) throw error;
  });
};
