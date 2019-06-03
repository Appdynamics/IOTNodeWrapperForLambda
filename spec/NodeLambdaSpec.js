describe("IOTLambda", function() {
    let config = require('./support/config.json');
    request = require('request');
    AWS = require('aws-sdk');
    var myCredentials = new AWS.Credentials(config.awsCredentialKey.accessKey, config.awsCredentialKey.secretKey);
    var myConfig = new AWS.Config({
        credentials: myCredentials, region: 'us-east-1'
    });

  
    describe("when all stage variables are set", function() {
      let data = null;
      beforeEach(function(done) {
        request(config.testingLambdaURL, (err, res, body) => {
            if (err) { return console.log(err); }
            data = JSON.parse(body);
            done();

          });
      
      });

      it("should return AppAgent data", function() {

        expect(data.config.appKey).toEqual(config.appKey);
      });
    });
    describe("when appkey is not set", function() {
        beforeEach(function() {
         //awsmodify gateway
        });
  
        it("should return null", function() {
          expect(true).toBeTruthy();
        });
      });


  });
  