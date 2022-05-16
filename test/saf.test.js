const fs = require('fs');
const AWSMock = require('aws-sdk-mock');
const should = require('should');
const handler = require('../handler.js');

const test_s3_event = {
    "Records": [{
        "s3": {
            'bucket': { 'name': 'test-bucket' },
            'object': {
                'key': 'red_hat_good.json'
            }
        }
    }]
}

function safCallback(error_message, success_message) {
    console.log("Called callback");
};

function setRequiredEnvVars(commandString) {
    process.env.COMMAND_STRING = commandString;
    process.env.INPUT_BUCKET = "test-bucket";
}

function setOptionalEnvVarsToDefaultValues() {
    process.env.OUTPUT_ENABLED = true;
    process.env.OUTPUT_EXTENSION = "_results.json";
    process.env.INPUT_PREFIX = "";
    process.env.OUTPUT_BUCKET = "test-bucket";
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
        setRequiredEnvVars("convert hdf2condensed");
        setOptionalEnvVarsToDefaultValues();
        mockS3GetObject();

        const output_buffer = Buffer.from(fs.readFileSync("test/red_hat_good_results.json"));

        AWSMock.mock('S3', 'upload', (params, callback) => {
            params.should.be.an.Object();
            params.should.have.property('Bucket', 'test-bucket');
            params.should.have.property('Key', "results/red_hat_good_results.json");
            params.should.have.property('Body', output_buffer);
        
            callback(null, null);
        });

        await handler.saf(test_s3_event, {}, safCallback);

        AWSMock.restore('S3');
    });

    test('should upload output files to different bucket than the input bucket when specified', async () => {
        setRequiredEnvVars("convert hdf2condensed");
        setOptionalEnvVarsToDefaultValues();
        process.env.OUTPUT_BUCKET = "test-output-bucket";

        mockS3GetObject();

        AWSMock.mock('S3', 'upload', (params, callback) => {
            params.should.be.an.Object();
            params.should.have.property('Bucket', 'test-output-bucket');

            callback(null, null);
        });

        await handler.saf(test_s3_event, {}, safCallback);

        AWSMock.restore('S3');
    });

    test('should call view summary without output option', async () => {
        setRequiredEnvVars("view summary");
        process.env.OUTPUT_ENABLED = false;

        mockS3GetObject();

        await handler.saf(test_s3_event, {}, safCallback);

        AWSMock.restore('S3');
    });
});
