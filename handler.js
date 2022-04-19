'use strict';

const aws = require('aws-sdk')
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const fs = require('fs');
const path = require("path");
const saf = require('@mitre/saf');

async function getObject(bucket, objectKey) {
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

module.exports.saf = async (event, context, callback) => {
    const bucket = event.Records[0].s3.bucket.name;

    const key = decodeURIComponent(
        event.Records[0].s3.object.key.replace(/\+/g, " ")
    );

    console.log("Getting object with bucket: " + bucket + " and key: " + key);

    const s3BucketObjectContents = await getObject(bucket, key);

    // TODO: Explore the saf update to use stdin instead of a file for the contents
    let HDF_FILE = path.resolve('/tmp/', key);
    await fs.writeFileSync(HDF_FILE, s3BucketObjectContents);

    const command_string_input = process.env.COMMAND_STRING_INPUT;
    const command_string = `${command_string_input} -i ${HDF_FILE}`;

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

    saf.run(saf_command);

    callback(null, `Completed saf function call with command ${command_string}`);
};