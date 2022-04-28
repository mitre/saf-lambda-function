# saf-lambda-function
This code uses the Serverless Framework to deploy an AWS lambda function that, when triggered by a file uploaded in an S3 bucket, will run the [SAF CLI](https://github.com/mitre/saf) with the given input command (`COMMAND_STRING_INPUT`).

## Getting Started
1. Clone this repository: `git clone https://github.com/mitre/saf-lambda-function.git`
2. Install the Serverless Framework: `npm install -g serverless`
3. Install the latest dependencies: `npm install`.
4. Configure your AWS credentials. [Recommended method](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) is to add a profile in the `~/.aws/credentials` file and then export that profile:
```bash
export AWS_PROFILE=<your_creds_profile_name>

# To ensure your access to AWS, run:
aws s3 ls
```

## Inputs
### Environment Variables
5. Set the S3 bucket name that you would like to upload your HDF file to
```bash
export BUCKET=<bucket-name>
```
6. Set the SAF CLI command environment variable. This lambda function will run `saf <command_string> -i input_file_from_bucket.json` 
Example:
```bash
export COMMAND_STRING_INPUT="convert hdf2splunk -H 127.0.0.1 -u admin -p Valid_password! -I your_index_name"
```
  - NOTE: Do not include the input flag in the command string as this will be appended on from the S3 bucket trigger, ex: "-i hdf_file.json".
  - NOTE: Do not include the output flag in the command string. Instead, set the desired output information in `config.json`.
  - NOTE: This action does not support `view heimdall`.
  - More examples can be found at [SAF CLI Usage](https://github.com/mitre/saf#usage)
  - You can ensure that the environment variables are set properly: `env`.
### Config variables
7. Modify any config values you may want to change. These are found in `config.json` and have the following default values:
```
{
    "service-name": "saf-lambda-function",
    "bucket-input-folder": "unprocessed/",
    "bucket-output-folder": "processed/",
    "output-enabled": true,
    "output-file-ext": ".json",
    "output-clarifier": "_output" 
}
```
If "output-enabled" is set to `true`, then the uploaded output file in s3 bucket will be named `<input_file_name><output-clarifier><output-file-ext>`.
EXAMPLE:
input file: `<BUCKET>/unprocessed/burpsuite_scan.xml`
output file: `<bucket-name>/processed/burpsuite_scan_output.json`

## Test and Deploy your SAF CLI Lambda function
### Test by invoking locally
8. Create an AWS bucket with your bucket name that you previously specified as an environment variable.
9. Load a file into the "bucket-input-folder" which is specified in the `config.json`.
10. If testing for the first time, run `npm make-event`. This will generate an s3 test event by running the command `serverless generate-event -t aws:s3 > test/event.json`.
11. Edit the bucket name and key in `test/event.json`.
```
"bucket": {
    "name": "your-bucket-name",
    ...
},
"object": {
    "key": "your-input-folder/you-file-name.json",
```
12. Run `npm test`.
You should see logging in the terminal and an uploaded output file in your s3 bucket if the `config.json` file specifies that the function should upload an output file.

Here, `npm test` is running the command: `serverless invoke local --function saf-lambda-function --path test/event.json`.
You can change the specifications more if needed by looking at the documentation for [serverless invoke local](https://www.serverless.com/framework/docs/providers/aws/cli-reference/invoke-local).

### Deploy the service 
13. `serverless deploy --verbose`. This may take several minutes.

### Test by invoking via AWS
14. When the service is deployed successfully, log into the AWS console, go to the "Lamda" interface, and set the S3 bucket as the trigger if not already shown.
![Screenshot 2022-04-20 at 09-30-41 Functions - Lambda](https://user-images.githubusercontent.com/32680215/164255328-782346f3-689f-458d-8ebe-b3f9af67964a.png)

15. You can test the service by uploading your input file into the `bucket-name` that your exported in step 2.![Screenshot 2022-04-20 at 09-32-39 sls-attempt-three-emcrod - S3 bucket](https://user-images.githubusercontent.com/32680215/164255397-a6b68b51-31da-4228-83eb-bcd5928f315e.png)


### Contributing

Please feel free to look through our issues, make a fork and submit PRs and improvements. We love hearing from our end-users and the community and will be happy to engage with you on suggestions, updates, fixes or new capabilities.

### Issues and Support

Please feel free to contact us by **opening an issue** on the issue board, or, at [saf@mitre.org](mailto:saf@mitre.org) should you have any suggestions, questions or issues.

---

### NOTICE

© 2022 The MITRE Corporation.

Approved for Public Release; Distribution Unlimited. Case Number 18-3678.

### NOTICE

MITRE hereby grants express written permission to use, reproduce, distribute, modify, and otherwise leverage this software to the extent permitted by the licensed terms provided in the LICENSE.md file included with this project.

### NOTICE

This software was produced for the U. S. Government under Contract Number HHSM-500-2012-00008I, and is subject to Federal Acquisition Regulation Clause 52.227-14, Rights in Data-General.

No other use other than that granted to the U. S. Government, or to those acting on behalf of the U. S. Government under that Clause is authorized without the express written permission of The MITRE Corporation.

For further information, please contact The MITRE Corporation, Contracts Management Office, 7515 Colshire Drive, McLean, VA 22102-7539, (703) 983-6000.

