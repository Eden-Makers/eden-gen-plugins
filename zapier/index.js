const authentication = require("./authentication");
const createTake = require("./creates/create-take");
const getTake = require("./creates/get-take");

const addAuthHeader = (request, z, bundle) => {
  request.headers = request.headers || {};
  request.headers.Authorization = `Bearer ${bundle.authData.apiToken}`;
  request.headers.Accept = "application/json";
  return request;
};

module.exports = {
  version: require("./package.json").version,
  platformVersion: require("zapier-platform-core").version,
  authentication,
  beforeRequest: [addAuthHeader],
  afterResponse: [],
  creates: {
    [createTake.key]: createTake,
    [getTake.key]: getTake,
  },
  triggers: {},
  searches: {},
  resources: {},
};
