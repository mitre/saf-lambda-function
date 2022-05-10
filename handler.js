'use strict';

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require("path");
const saf_cli = require('@mitre/saf');
const { createWinstonLogger } = require("./lib/logger.js");

async function getObject(s3, bucket, objectKey) {
    try {
        const params = {
            Bucket: bucket,
            Key: objectKey
        }

        const data = await s3.getObject(params).promise();

        return data.Body.toString('utf-8');
    } catch (e) {
        throw new Error(`Could not retrieve file from S3: ${e.message}`)
    }
}

async function uploadFile(s3, fileName, bucket, key) {
    try {
        const fileContent = fs.readFileSync(fileName);

        const params = {
            Bucket: bucket,
            Key: key, // File name you want to save as in S3
            Body: fileContent
        };

        await s3.upload(params).promise();
        console.log('File uploaded successfully.')
    } catch (e) {
        throw new Error(`Could not upload file to S3: ${e.message}`)
    }
}

function getInputFileName(key) {
    return path.basename(key);
}

function getOutputFileName(input_file_name, configData) {
    const input_file_ext = path.extname(input_file_name);
    const file_name_no_ext = path.basename(input_file_name, input_file_ext);
    return file_name_no_ext + configData['output-extension'];
}

function getConfigData() {
    const config = {
        "input-bucket": process.env.INPUT_BUCKET,
        "input-prefix": process.env.INPUT_PREFIX,
        "output-bucket": process.env.OUTPUT_BUCKET,
        "output-prefix": process.env.OUTPUT_PREFIX,
        "output-extension": process.env.OUTPUT_EXTENSION,
        "output-enabled": process.env.OUTPUT_ENABLED,
    }

    return config;
}

async function runSaf(command_string) {
    if (!command_string) {
        throw new Error("SAF CLI Command String argument is required.");
    }

    const saf_command = command_string.split(' ');

    const allowable_topics = ['convert', 'generate', 'harden', 'scan', 'validate', 'view'];
    const topic = saf_command[0].split(':')[0];

    if (!allowable_topics.includes(topic)) {
        throw new Error("The command string did not include one of the allowable topics: " + allowable_topics.join(', ') + ". Please reference the documentation for more details.");
    }

    const command = saf_command[0].includes(':') ? saf_command[0].split(':')[1] : saf_command[1];

    if (topic == "view" & command == "heimdall") {
        throw new Error("The SAF Action does not support the 'view heimdall' command. Please reference the documentation for other uses.");
    }

    await saf_cli.run(saf_command);
}

module.exports.saf = async (event, context, callback) => {
    const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
    const configData = getConfigData();
    const logger = createWinstonLogger(process.env.LOG_LEVEL || 'debug');
    logger.debug("Called SAF lambda function.");

    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

    logger.info("Getting object with bucket: " + bucket + " and key: " + key);
    const s3BucketObjectContents = await getObject(s3, bucket, key);

    const input_file_name = getInputFileName(key);
    let INPUT_FILE = path.resolve('/tmp/', input_file_name);
    logger.info("Input file: " + INPUT_FILE);
    await fs.writeFileSync(INPUT_FILE, s3BucketObjectContents);

    const command_string_input = process.env.COMMAND_STRING;
    let command_string = `${command_string_input} -i ${INPUT_FILE}`;

    const output_file_name = getOutputFileName(input_file_name, configData);
    let OUTPUT_FILE = path.resolve('/tmp/', output_file_name);
    if (configData['output-enabled']) {
        command_string = `${command_string_input} -i ${INPUT_FILE} -o ${OUTPUT_FILE}`;
    }

    logger.info("Calling SAF CLI with the command: " + command_string);
    await runSaf(command_string);

    // Put results file in the bucket in the output location
    if (configData['output-enabled']) {
        let outputKey = path.join(configData['output-prefix'], output_file_name);
        logger.info("Output key: " + outputKey + " for bucket: " + configData['output-bucket']);
        await uploadFile(s3, OUTPUT_FILE, configData['output-bucket'], outputKey);
    }
    callback("Error. Did not complete the lambda function successfully.", `Completed saf function call with command ${command_string}`);
}
