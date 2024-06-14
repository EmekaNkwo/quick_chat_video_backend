const serverless = require("serverless-http");
const server = "../server.js";

module.exports.handler = serverless(server);
