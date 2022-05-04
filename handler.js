'use strict';

const aws = require('aws-sdk')
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const fs = require('fs');
const path = require("path");
const saf = require('@mitre/saf');
const { createWinstonLogger } = require("./lib/logger.js");

const uploadFile = (fileName, bucket, key) => {
    const fileContent = fs.readFileSync(fileName);

    const params = {
        Bucket: bucket,
        Key: key, // File name you want to save as in S3
        Body: fileContent
    };

    s3.upload(params, function (err, data) {
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
        "output-enabled": process.env.OUTPUT_ENABLED || true,
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

async function uploadAllFiles(path, configData) {
    logger.info("Opening directory: " + path);
    const dir = await fs.promises.opendir(path)
    for await (const dirent of dir) {
        logger.info("Looking at the following entry: " + dirent);
        let outputKey = path.relative('/tmp/', dirent);
        logger.info("Output key: " + outputKey + " for bucket: " + configData['output-bucket']);
        uploadFile(dirent, configData['output-bucket'], outputKey);
        console.log(dirent.name);
    }
}

module.exports.saf = async (event, context, callback) => {
    const configData = getConfigData();
    const logger = createWinstonLogger(context.awsRequestId, process.env.LOG_LEVEL || 'debug');
    logger.debug("Called SAF lambda function.");

    const command_string_input = process.env.COMMAND_STRING;
    let command_string = `${command_string_input}`;

    let OUTPUT_FOLDER = path.resolve('/tmp/', configData['output-prefix']);
    if (configData['output-enabled']) {
        command_string = `${command_string_input} -o ${OUTPUT_FOLDER}`;
    }

    logger.info("Calling SAF CLI with the command: " + command_string);
    await runSaf(command_string)
        .then(() => {
            // Put results file in the bucket in the output location
            if (configData['output-enabled']) {
                uploadAllFiles(OUTPUT_FOLDER, configData);
            }
            callback(null, `Completed saf function call with command ${command_string}`);
        });
};
