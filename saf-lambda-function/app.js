// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
//const core = require('@actions/core'); specific to github actions
const saf = require('@mitre/saf');
const fs = require('fs');
const path = require("path");
//const winston = require('winston');
//const logging = require('utils/logging');
const winston = require('winston');
const { createLogger, format, transports } = winston;
let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

exports.lambdaHandler = async (event, context) => {

  const logger = createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: format.combine(
        format.timestamp(),
        format.simple()
    ),
    transports: [
      new transports.Console({
        format: format.combine(
            format.timestamp({
              format: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
            }),
            format.printf(
                info => `${[info.timestamp]}\t${context.awsRequestId}\t${logger.level.toUpperCase()}\t${info.message}`,
            )
        )
      })
    ]
  })

  logger.log({
    level: 'debug',
    message: 'Logging Level set to  : ' + logger.level.toUpperCase()
  });

  // TODO: Decide is we want to catch undefined saf-cli command groupings
  // https://stackoverflow.com/questions/15201939/jquery-javascript-check-string-for-multiple-substringsa
  // TODO: Removed hardcoded data and move to lambda paramaters
  const HEC_TOKEN = "473b3297-1d88-4740-96ff-e6048e51b785";
  const SPLUNK_SERVER = "splk1.efficacy.online";
  const CLI_COMMAND = "convert"
  const CLI_FUNCTION = "hdf2splunk"

  // TODO: Add the rest of the parameters
  /*
  - -t HEC_TOKEN
  - -i HDF_FILE
  - SPLUNK_PORT(defults to 8089)
  - SPLUNK_INDEX(defauls to HEC default )
  - INSECURE(ignore_ssl)
  - PROTOCOL(defults to https)
  - DEBUG - for logging in lambda logging
  */

  // TODO: Remove in final release
  logger.debug("Loading Function");
  logger.debug("Received context:" + JSON.stringify(context));

  // Get the object from the event and show its content type
  const bucket = event.Records[0].s3.bucket.name;

  const key = decodeURIComponent(
      event.Records[0].s3.object.key.replace(/\+/g, " ")
  );

  // READ PARAMS
  const params = {
    Bucket: bucket,
    Key: key,
  };

  try {
    // const ret = await axios(url);

    logger.info("Read from bucket: " + params.Bucket);
    logger.info("Reading File:     " + params.Key);

    let { ContentType, Body } = await s3.getObject(params).promise();

    logger.debug("Received File ContentType - " + ContentType);

    let HDF_FILE = path.resolve('/tmp/', params.Key.toString());

    Body = Body.toString();

    const command_string = [CLI_COMMAND+':'+CLI_FUNCTION, '-i', HDF_FILE, '-H', SPLUNK_SERVER, '-t', HEC_TOKEN  ];

    await fs.writeFileSync(HDF_FILE, Body)

    logger.info("Wrote file into runtime environment: " + HDF_FILE);

    //const data = fs.readFileSync(HDF_FILE, "utf8" );

    logger.debug("Finished reading object type: " + JSON.stringify(ContentType));

    // TODO: Remove the hardcoded saf-cli command
    // TODO: Remove the ||
    /* TODO: Add the rest of the possible options to the command_string builder
    - SPLUNK_PORT (defults to 8089)
    - SPLUNK_INDEX (defauls to HEC default)
    - INSECURE (ignore_ssl)
    - PROTOCOL (defults to https)
    - DEBUG - for logging in lambda logging
    */

    if (!command_string) {
      throw new Error("SAF CLI Command String argument is required. See http://saf-cli.mitre.org for more details.");
    }

    if (CLI_COMMAND.trim() === "view" && CLI_FUNCTION.trim() === "heimdall") {
      throw new Error(
          "You cannot use the 'saf view:heimdall' command in this environment."
      );
    }

    logger.debug("command_string: " + command_string.join(' '));

    // Normal logging - perhpas we add a 'silent' to just have an ACK at the end
    logger.info("Pushing HDF Data: " + HDF_FILE +  " to server: " + SPLUNK_SERVER)

    let saf_cli_response  = await saf.run(command_string);

    response = {
      'statusCode': 200,
      'body': JSON.stringify({
        message: saf_cli_response
      })
    }
  } catch (err) {
    logger.info(err);
    return err;
  }

  return response
};


exports.handler = async function(event, context) {
  console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
  console.info("EVENT\n" + JSON.stringify(event, null, 2))
  console.warn("Event not processed.")
  return context.logStreamName
}




