const fs = require('fs');
const AWSMock = require('aws-sdk-mock');
const should = require('should');
const handler = require('../handler.js');

function get_test_s3_event(key) {
    const test_s3_event = {
        "Records": [{
            "s3": {
                'bucket': { 'name': 'test-bucket' },
                'object': {
                    'key': key
                }
            }
        }]
    }

    return test_s3_event;
}

function safCallback(error_message, success_message) {
    console.log("Called callback");
};

function setRequiredEnvVars(commandString) {
    process.env.COMMAND_STRING = commandString;
    process.env.INPUT_BUCKET = "test-bucket";
}

function setOptionalEnvVarsToDefaultValues() {
    process.env.OUTPUT_ENABLED = "true";
    process.env.OUTPUT_EXTENSION = "_results.json";
    process.env.INPUT_PREFIX = "";
    process.env.OUTPUT_BUCKET = "test-bucket";
    process.env.OUTPUT_PREFIX = "results/";
    process.env.SERVICE_NAME = "saf-lambda-function";
}

function mockS3GetObject(file_path) {
    AWSMock.mock('S3', 'getObject', function (parmas, callback) {
        callback(null, {
            Body: Buffer.from(fs.readFileSync(file_path))
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

    test('should call a SAF CLI command with the default configuration for optional variables', async () => {
        setRequiredEnvVars("convert hdf2condensed");
        setOptionalEnvVarsToDefaultValues();
        mockS3GetObject("test/input/red_hat_good.json");

        const output_buffer = Buffer.from(fs.readFileSync("test/output/red_hat_good_results.json"));

        AWSMock.mock('S3', 'upload', (params, callback) => {
            params.should.be.an.Object();
            params.should.have.property('Bucket', 'test-bucket');
            params.should.have.property('Key', "results/red_hat_good_results.json");
            params.should.have.property('Body', output_buffer);
        
            callback(null, null);
        });

        const test_s3_event = get_test_s3_event("red_hat_good.json");

        await handler.saf(test_s3_event, {}, safCallback);

        AWSMock.restore('S3');
    });

    test('should upload output files to different bucket than the input bucket when specified', async () => {
        setRequiredEnvVars("convert hdf2condensed");
        setOptionalEnvVarsToDefaultValues();
        process.env.OUTPUT_BUCKET = "test-output-bucket";

        mockS3GetObject("test/input/red_hat_good.json");

        AWSMock.mock('S3', 'upload', (params, callback) => {
            params.should.be.an.Object();
            params.should.have.property('Bucket', 'test-output-bucket');

            callback(null, null);
        });

        const test_s3_event = get_test_s3_event("red_hat_good.json");

        await handler.saf(test_s3_event, {}, safCallback);

        AWSMock.restore('S3');
    });

    test('should call view summary without output option', async () => {
        setRequiredEnvVars("view summary");
        setOptionalEnvVarsToDefaultValues();
        process.env.OUTPUT_ENABLED = "false";

        mockS3GetObject("test/input/red_hat_good.json");

        const test_s3_event = get_test_s3_event("red_hat_good.json");

        await handler.saf(test_s3_event, {}, safCallback);

        AWSMock.restore('S3');
    });

    test('should call a command that does not allow the -o flag', async () => {
        setRequiredEnvVars("validate threshold -F test/input/threshold.yaml");
        setOptionalEnvVarsToDefaultValues();

        mockS3GetObject("test/input/red_hat_good.json");

        const test_s3_event = get_test_s3_event("red_hat_good_validate.json");

        await handler.saf(test_s3_event, {}, safCallback);

        AWSMock.restore('S3');
    });
});
