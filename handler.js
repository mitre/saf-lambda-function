'use strict';

const aws = require('aws-sdk')
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const fs = require('fs');
const path = require("path");
const saf = require('@mitre/saf');
const { createWinstonLogger } = require("./lib/logger.js");

const uploadFile = async (fileName, bucket, key) => {
    const fileContent = fs.readFileSync(fileName);

    const params = {
        Bucket: bucket,
        Key: key, // File name you want to save as in S3
        Body: fileContent
    };

    await s3.upload(params, function (err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
};

const getConfigData = () => {
    const config = {
        "output-bucket": process.env.OUTPUT_BUCKET,
        "output-prefix": process.env.OUTPUT_PREFIX || "results/",
        "output-enabled": ('OUTPUT_ENABLED' in process.env) ? (process.env.OUTPUT_ENABLED === "true") : true,
    }
    return config;
};

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

    const command = saf_command[0].split(':')[1];

    if (topic == "view" & command == "heimdall") {
        throw new Error("The SAF Action does not support the 'view heimdall' command. Please reference the documentation for other uses.");
    }

    await saf.run(saf_command);
}

async function uploadAllFiles(folder, configData, logger) {
    logger.info("Opening directory: " + folder);
    const dir = await fs.promises.opendir(folder);
    for await (const dirent of dir) {
        logger.info("Looking at the following entry: " + dirent.name);
        let localFileName = path.join(folder, dirent.name);
        let outputKey = path.relative('/tmp/', localFileName).replace(/^\\\\\?\\/, "").replace(/\\/g, '\/').replace(/\/\/+/g, '\/');
        logger.info("Local File Name: " + localFileName + ", Output key: " + outputKey + " for bucket: " + configData['output-bucket']);
        await uploadFile(localFileName, configData['output-bucket'], outputKey);
    }
}

module.exports.saf = async (event, context, callback) => {
    const configData = getConfigData();
    const logger = createWinstonLogger(context.awsRequestId, process.env.LOG_LEVEL || 'debug');
    logger.debug("Called SAF lambda function.");
    logger.info("Output bucket: " + configData['output-bucket']);
    logger.info("Output prefix: " + configData['output-prefix']);
    logger.info("Output enabled: " + configData['output-enabled']);

    const command_string_input = process.env.COMMAND_STRING;
    let command_string = `${command_string_input}`;

    let OUTPUT_FOLDER = path.resolve('/tmp/', configData['output-prefix']);
    // Clear results folder from any old data
    if (fs.existsSync(OUTPUT_FOLDER)) {
        await fs.promises.rmdir(OUTPUT_FOLDER, { recursive: true });
        logger.debug("Cleared old data from the folder: " + OUTPUT_FOLDER);
    }

    if (configData['output-enabled']) {
        logger.debug("Output is enabled. Setting command string to include output folder.");
        command_string = `${command_string_input} -o ${OUTPUT_FOLDER}`;
    }

    logger.info("Calling SAF CLI with the command: " + command_string);
    await runSaf(command_string);
    // Put results file in the bucket in the output location
    if (configData['output-enabled']) {
        logger.info("Starting to upload all files.");
        await uploadAllFiles(OUTPUT_FOLDER, configData, logger);
    }
    callback('ERROR: Saf lambda function did not complete successfully.', `Completed saf function call with command ${command_string}`);
};
