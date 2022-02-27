const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
//const core = require('@actions/core'); specific to github actions
const saf = require('@mitre/saf');
const fs = require('fs');

exports.handler = async (event, context) => {

    console.log('Loading function');

    //console.log('Received event:', JSON.stringify(event, null, 2))
    console.log('Received context:', JSON.stringify(context));

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    };

    const hec1 = '473b3297-1d88-4740-96ff-e6048e51b785';
    //const splunkToken = '3.236.165.7';
    const splunkToken = 'splk1.efficacy.online';

    try {
        console.log('bucket');
        console.log(params.Bucket);
        console.log(params.Key);

        const { ContentType } = await s3.getObject(params).promise();
        console.log('CONTENT TYPE:', ContentType);

        const InputFileLocal = './' + params.Key.toString()

        console.log('Write File:', InputFileLocal);
        const storeData = (ContentType, InputFileLocal) => {
            try {
                fs.writeFileSync(InputFileLocal, JSON.stringify(ContentType))
            } catch (err) {
                console.error(err)
            }
        }

        console.log('Read File:', InputFileLocal);
        fs.readFile(InputFileLocal, 'utf8', (err, jsonString) => {
            if (err) {
                console.log("File read failed:", err)
                return
            }
            console.log('File data:', jsonString)
        })

        console.log('saf+++', JSON.stringify(ContentType));

        //process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

        exports.handler = async (event) => {
            console.log('Environment Variables -START');
            console.log(process.env);
            console.log('Environment Variables -END');
        };

        // Testing, remove the hardcoded string and the OR
        const command_string = "convert:hdf2splunk -i " + InputFileLocal + ' -H ' + splunkToken + ' -t ' + hec1 || JSON.stringify(context) ;

        if(!command_string) {
            throw new Error("SAF CLI Command String argument is required.");
        }

        if(command_string.split(" ")[0] == "view:heimdall") {
            throw new Error("The SAF Action does not support the 'view:heimdall' command. Please reference the documentation for other uses.");
        }

        console.log('command_string: ', command_string.toString())

        saf.run(command_string.split(" "));




        return ContentType;
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};

