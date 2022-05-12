const fs = require('fs');
const AWSMock = require('aws-sdk-mock');
const should = require('should');
const handler = require('../handler.js');

const test_s3_event = {
    "Records": [{
        "s3": {
            'bucket': { 'name': 'test_bucket' },
            'object': {
                'key': 'red_hat_good.json'
            }
        }
    }]
}

function safCallback(error_message, success_message) {
    console.log("Called callback");
};

function setDefaultEnvVars() {
    process.env.OUTPUT_ENABLED = true;
    process.env.OUTPUT_EXTENSION = "_results.json";
    process.env.COMMAND_STRING = "convert hdf2condensed";
    process.env.INPUT_BUCKET = "test_bucket";
    process.env.INPUT_PREFIX = "";
    process.env.OUTPUT_BUCKET = "test_bucket";
    process.env.OUTPUT_PREFIX = "results/";
    process.env.SERVICE_NAME = "saf-lambda-function";
}

function mockS3GetObject() {
    AWSMock.mock('S3', 'getObject', function (parmas, callback) {
        callback(null, {
            Body: Buffer.from(fs.readFileSync("test/red_hat_good.json"))
        })
    });
}

describe('SAF Lambda', () => {

    const OLD_ENV = process.env;

    beforeEach(() => {
        process.env = { ...OLD_ENV }; // Make a copy
    });

    afterAll(() => {
        process.env = OLD_ENV; // Restore old environment
    });

    test('should call convert hdf2condensed', async () => {
        setDefaultEnvVars();
        mockS3GetObject();

        const output_buffer = Buffer.from(fs.readFileSync("test/red_hat_good_results.json"));

        AWSMock.mock('S3', 'upload', (params, callback) => {
            params.should.be.an.Object();
            params.should.have.property('Bucket', 'test_bucket');
            params.should.have.property('Key', "results/red_hat_good_results.json");
            params.should.have.property('Body', output_buffer);
        
            callback(null, null);
        });

        await handler.saf(test_s3_event, {}, safCallback);

        AWSMock.restore('S3');
    });

    test('should call convert hdf2condensed with unique output bucket', async () => {
        setDefaultEnvVars();
        process.env.OUTPUT_BUCKET = "test_output_bucket";

        mockS3GetObject();

        AWSMock.mock('S3', 'upload', (params, callback) => {
            params.should.be.an.Object();
            params.should.have.property('Bucket', 'test_output_bucket');

            callback(null, null);
        });

        await handler.saf(test_s3_event, {}, safCallback);

        AWSMock.restore('S3');
    });
});
