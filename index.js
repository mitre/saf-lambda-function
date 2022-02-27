const aws = require("aws-sdk");
const saf = require("@mitre/saf");
const s3 = new aws.S3({ apiVersion: "2006-03-01" });
const fs = require("fs");

exports.handler = async (event, context) => {
    // TODO: Decide is we want to catch undefined saf-cli command groupings
    // https://stackoverflow.com/questions/15201939/jquery-javascript-check-string-for-multiple-substrings
    // TODO: Removed hardcoded data and move to lambda paramaters
    const HEC_TOKEN = "473b3297-1d88-4740-96ff-e6048e51b785";
    const SPLUNK_SERVER = "splk1.efficacy.online";
    const CLI_COMMAND = "convert"
    const CLI_FUNCTION = "hdf2splunk"
    // TODO: Add the rest of the paramaters
    /*
    - SPLUNK_PORT(defults to 8089)
    - SPLUNK_INDEX(defauls to HEC default )
    - INSECURE(ignore_ssl)
    - PROTOCOL(defults to https)
    - DEBUG - for logging in lambda logging
    */

    // TODO: Remove in final release
    console.log("Loading function");

    //console.log('Received event:', JSON.stringify(event, null, 2))
    // TODO: Move to 'debug' mode
    console.log("Received context:", JSON.stringify(context));

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;

    const key = decodeURIComponent(
        event.Records[0].s3.object.key.replace(/\+/g, " ")
    );
    const params = {
        Bucket: bucket,
        Key: key,
    };

    try {
        console.log("bucket");
        console.log(params.Bucket);
        console.log(params.Key);

        const { ContentType } = await s3.getObject(params).promise();

        console.log("Recieved a ", ContentType, " file.");

        const HDF_FILE = "./" + params.Key.toString();

        console.log("Wrote file: ", HDF_FILE);

        const storeData = (ContentType, HDF_FILE) => {
            try {
                fs.writeFileSync(HDF_FILE, JSON.stringify(ContentType));
            } catch (err) {
                console.error(err);
            }
        };

        console.log("Reading file: ", HDF_FILE);
        fs.readFile(HDF_FILE, "utf8", (err, jsonString) => {
            if (err) {
                console.log("File read failed, with error: ", err);
                return;
            }
            console.log("File Content: \n", jsonString);
        });

        // TODO: Move this to 'debug'
        console.log("saf+++", JSON.stringify(ContentType));
        exports.handler = async (event) => {
            console.log("Environment Variables -START");
            console.log(process.env);
            console.log("Environment Variables -END");
        };

        // TODO: Remove the hardcoded saf-cli command 
        // TODO: Remove the ||
        /* TODO: Add the rest of the possible options to the command_string builder
        - SPLUNK_PORT (defults to 8089)
        - SPLUNK_INDEX (defauls to HEC default)
        - INSECURE (ignore_ssl)
        - PROTOCOL (defults to https)
        - DEBUG - for logging in lambda logging
        */
        const command_string =
            CLI_COMMAND +
            ":" +
            CLI_FUNCTION +
            " - i" +
            HDF_FILE +
            " -H " +
            SPLUNK_SERVER +
            " -t " +
            HEC_TOKEN || JSON.stringify(context);

        if (!command_string) {
            throw new Error("SAF CLI Command String argument is required. See http://saf-cli.mitre.org for more details.");
        }

        if (CLI_COMMAND.trim() === "view" && CLI_FUNCTION.trim() === "heimdall") {
            throw new Error(
                "You cannot use the 'saf view:heimdall' command in this environment."
            );
        }

        // TODO: Move all console.log to a 'debug' mode we can specify
        console.log("command_string: ", command_string.toString());

        // Normal logging - perhpas we add a 'silent' to just have an ACK at the end
        console.log("Pushing HDF Data", HDF_FILE, "to ", SPLUNK_SERVER)

        saf.run(command_string.split(" "));

        return ContentType;
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};
