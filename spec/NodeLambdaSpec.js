function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
describe("IOTLambda", function () {
  let config = require('./support/config.json');
  jasmine.DEFAULT_TIMEOUT_INTERVAL = config.timeout + 5000;
  // sleep time expects milliseconds


  request = require('request');
  AWS = require('aws-sdk');
  // var myCredentials = new AWS.Credentials(config.awsCredentialKey.accessKey, config.awsCredentialKey.secretKey);
  // var myConfig = new AWS.Config({
  //     credentials: myCredentials, region: 'us-east-1'
  // });
  AWS.config.loadFromPath('./spec/support/awsconfig.json');
  var apigateway = new AWS.APIGateway();
  var updateStage = function (apikey, enabled, loglevel, cb) {
    apigateway.updateStage({
      restApiId: config.restApiId,
      stageName: config.stage,
      patchOperations: [
        {
          op: 'replace',
          path: '/variables/APPDYNAMICS_APPKEY',
          value: apikey
        },
        {
          op: 'replace',
          path: '/variables/APPDYNAMICS_ENABLED',
          value: enabled
        },
        {
          op: 'replace',
          path: '/variables/APPDYNAMICS_LOGLEVEL',
          value: loglevel
        }

      ]
    }, (err, apiconfirmed) => {
      if (err) {
        console.error('Problem Updating API Gateway');
        done();
      } else {
        //Have to sleep. Changes are not immediate on the api endpoint.
        sleep(config.timeout).then(() => {
          cb();
        });
      }

    });
  };

  describe("when all stage variables are set", function () {
    it("should return AppAgent data", function (done) {
      updateStage(config.appKey, 'true', 'DEUBG', () => {
        apigateway.makeRequest()
        request(config.testingLambdaURL, (err, res, body) => {
          if (err) { return console.log(err); }
          var data = JSON.parse(body);
          expect(data.config.appKey).toEqual(config.appKey);
          done();
        });
      });
    });
  });

  describe("when appkey is not set", function () {
    it("should return null", function (done) {
      updateStage('', 'true', 'DEUBG', () => {
        request(config.testingLambdaURL, (err, res, body) => {
          if (err) { return console.log(err); }
          var data = JSON.parse(body);
          expect(data).not.toEqual(config.appKey);
          done();
        });
      });
    });
  });

  describe("when enabled is not set", function () {
    it("should return null", function (done) {
      updateStage(config.appKey, '', 'DEUBG', () => {
        request(config.testingLambdaURL, (err, res, body) => {
          if (err) { return console.log(err); }
          var data = JSON.parse(body);
          expect(data).not.toEqual(config.appKey);
          done();
        });
      });
    });
  });

  describe("when neither is not set", function () {
    it("should return null", function (done) {
      updateStage('', '', 'DEUBG', () => {
        request(config.testingLambdaURL, (err, res, body) => {
          if (err) { return console.log(err); }
          var data = JSON.parse(body);
          expect(data).not.toEqual(config.appKey);
          done();
        });
      });
    });
  });
  describe("when appKey and enabled is set but not loglevel", function () {
    it("return AppAgent data", function (done) {
      updateStage(config.appKey, 'true', '', () => {
        request(config.testingLambdaURL, (err, res, body) => {
          if (err) { return console.log(err); }
          var data = JSON.parse(body);
          expect(data.config.appKey).toEqual(config.appKey);
          done();
        });
      });
    });
  });
  describe("when appKey is set and enabled is false ", function () {
    it("should be null", function (done) {
      updateStage(config.appKey, 'true', '', () => {
        request(config.testingLambdaURL, (err, res, body) => {
          if (err) { return console.log(err); }
          var data = JSON.parse(body);
          expect(data).not.toEqual(config.appKey);
          done();
        });
      });
    });
  });

  
});
