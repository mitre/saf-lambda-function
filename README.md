# saf-lambda-function
This code uses the Serverless Framework to deploy an AWS lambda function that, when triggered by a file uploaded in an S3 bucket, will run the [SAF CLI](https://github.com/mitre/saf) with the given input command (`COMMAND_STRING`) and can optionally upload results to an S3 bucket.

## Getting Started
1. Clone this repository: `git clone https://github.com/mitre/saf-lambda-function.git`
2. Install the Serverless Framework: `npm install -g serverless`
3. Install the latest dependencies: `npm install`
4. Configure your AWS credentials. [Recommended method](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) is to add a profile in the `~/.aws/credentials` file and then export that profile:
```bash
export AWS_PROFILE=<your_creds_profile_name>

# To ensure your access to AWS, run:
aws s3 ls
```

## Setting Up the Lambda Function
This lambda function uses environment variables to orchestrate its function. The required environment variables are `INPUT_BUCKET` and `COMMAND_STRING_INPUT`. The bucket environment variable defines the source bucket for your input to the SAF CLI command, and the command string defines the SAF CLI function and its flags _excluding_ the `-i input` and `-o output` flags which are handled by your input and output bucket and object configurations.
### Additional Input and Output Configuration
Additional optional variables can be set to further configure the function. The table below shows each variable and the default behavior. The `INPUT_PREFIX` specifies a path in the INPUT_BUCKET. If set, this function will trigger when a file is uploaded to that path location and run the SAF CLI with the uploaded file. If not set, the function will trigger when an object is loaded in the main directory of the INPUT_BUCKET. The `OUTPUT_BUCKET` can be set as the location to upload results of the SAF CLI command. The `OUTPUT_ENABLED` variable can be set to `false` if the function should not upload results to an S3 bucket. The `OUTPUT_EXTENSION` is the appended name and extension for the output file, if the output is enabled. For example, if the input file is named "my-file.csv" and the `OUTPUT_EXTENSION` is set to "_results.json", then the output file will be named "my-file_results.json". The `OUTPUT_PREFIX` specifies a path within the OUTPUT_BUCKET to place the results of the SAF CLI call. The `SERVICE_NAME` will be the name of this lambda service when deployed.

| ENVIRONMENT NAME | Required | Default | Examples |
| --- | --- | --- | --- |
| **COMMAND_STRING** | x | none | "convert hdf2splunk -H 127.0.0.1 -u admin -p Valid_password! -I hdf", "convert burpsuite2hdf", See more [here](https://github.com/mitre/saf#usage) |
| **INPUT_BUCKET** | x | none | "bucket-name" |
| INPUT_PREFIX |  | "" | "unprocessed/", "unprocessed/hdf/" |
| OUTPUT_BUCKET |  | The value assigned to `INPUT_BUCKET` | "other-bucket-name" |
| OUTPUT_ENABLED |  | true | false |
| OUTPUT_EXTENSION |  | "_results.json" | ".json", ".csv", "_output.json" |
| OUTPUT_PREFIX |  | "results/" | "output/", "results/hdf/", "" |
| OUTPUT_TIMEOUT |  | 60 | lambda timeout value in seconds |
| SERVICE_NAME |  | "saf-lambda-function" | "different-service-name" |

5. Set the required variables: `INPUT_BUCKET` and `COMMAND_STRING`.
- Example:
```bash
export INPUT_BUCKET="bucket-name"
export COMMAND_STRING="convert hdf2splunk -H 127.0.0.1 -u admin -p Valid_password! -I your_index_name"
```
  - NOTE: Do not include the input flag (i.e. "-i hdf_file.json") in the command string as this will be handled by the S3 input bucket configuration.
  - NOTE: Do not include the output flag in the command string. Instead, set the output configuration variables.
  - NOTE: This action does not support `view heimdall`.
  - More examples can be found at [SAF CLI Usage](https://github.com/mitre/saf#usage)
  - You can ensure that the environment variables are set properly: `env`.
6. Set any optional variables that you may want to change. If the default value for any of these variables suffices, it does not need to be set.

## Test and Deploy your SAF CLI Lambda function
### Test by invoking locally
7. Create an AWS bucket with the name that you set as the value for `INPUT_BUCKET`.
8. Load a file into the `INPUT_BUCKET`. Upload the file in the `INPUT_PREFIX` path if specified.
9. If testing for the first time, run `npm make-event`. This will generate an s3 test event by running the command `serverless generate-event -t aws:s3 > test/event.json`.
10. Edit the bucket name and key in `test/event.json`.
```
"bucket": {
    "name": "your-bucket-name",
    ...
},
"object": {
    "key": "your-input-folder/you-file-name.json",
```
11. Run `npm test`.
You should see logging in the terminal and an uploaded output file in your s3 bucket if the output is enabled.

Here, `npm test` is running the command: `serverless invoke local --function saf-lambda-function --path test/event.json`.
You can change the specifications more if needed by looking at the documentation for [serverless invoke local](https://www.serverless.com/framework/docs/providers/aws/cli-reference/invoke-local).

### Deploy the service 
12. `serverless deploy --verbose`. This may take several minutes.

### Test by invoking via AWS
13. When the service is deployed successfully, log into the AWS console, go to the "Lamda" interface, and set the S3 bucket as the trigger if not already shown.
![Screenshot 2022-04-20 at 09-30-41 Functions - Lambda](https://user-images.githubusercontent.com/32680215/164255328-782346f3-689f-458d-8ebe-b3f9af67964a.png)

14. You can test the service by uploading your input file into the `INPUT_BUCKET`. Upload the file in the `INPUT_PREFIX` path if specified.![Screenshot 2022-04-20 at 09-32-39 sls-attempt-three-emcrod - S3 bucket](https://user-images.githubusercontent.com/32680215/164255397-a6b68b51-31da-4228-83eb-bcd5928f315e.png)


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

