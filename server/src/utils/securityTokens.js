const crypto = require("crypto");

const createPlainToken = () => crypto.randomBytes(32).toString("hex");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports = {
  createPlainToken,
  hashToken
};
