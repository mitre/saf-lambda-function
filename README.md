# saf-lambda-function
This code uses the Serverless Framework to deploy an AWS lambda function that, when triggered at a certain rate, will run the [SAF CLI](https://github.com/mitre/saf) with the given input command (`COMMAND_STRING`) and can optionally upload results to an S3 bucket. This example is specifically relevant to running the command `convert ionchannel2hdf`.

## Getting Started
(This is installed and kept up to date using `npm`, which is included with most versions of [NodeJS](https://nodejs.org/en/).)
1. Clone this repository: `git clone https://github.com/mitre/saf-lambda-function.git -b ionChannel`
2. cd saf-lambda-function
3. Install the latest dependencies: `npm install`
4. Install the Serverless Framework: `npm install -g serverless`
5. Configure your AWS credentials. [Recommended method](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) is to add a profile in the `~/.aws/credentials` file and then export that profile:
```bash
export AWS_PROFILE=<your_creds_profile_name>

# To ensure your access to AWS, run:
aws s3 ls
```

## Setting Up the Lambda Function
This lambda function uses environment variables to orchestrate its function. The required environment variables are `OUTPUT_BUCKET` and `COMMAND_STRING`. The bucket environment variable defines the source bucket for your input to the SAF CLI command, and the command string defines the SAF CLI function and its flags _excluding_ the `-i input` and `-o output` flags which are handled by your input and output bucket and object configurations.
### Additional Input and Output Configuration
Additional optional variables can be set to further configure the function. The table below shows each variable and the default behavior. The `OUTPUT_BUCKET` can be set as the location to upload results of the SAF CLI command. The `OUTPUT_ENABLED` variable can be set to `false` if the function should not upload results to an S3 bucket. The `OUTPUT_PREFIX` specifies a path within the OUTPUT_BUCKET to place the results of the SAF CLI call. The `SERVICE_NAME` will be the name of this lambda service when deployed.

| ENVIRONMENT NAME | Required | Default | Examples |
| --- | --- | --- | --- |
| **COMMAND_STRING** | x | none | "convert hdf2splunk -H 127.0.0.1 -u admin -p Valid_password! -I hdf", "convert burpsuite2hdf", See more [here](https://github.com/mitre/saf#usage) |
| **OUTPUT_BUCKET** | x | none | "other-bucket-name" |
| OUTPUT_ENABLED |  | true | false |
| OUTPUT_PREFIX |  | "results/" | "output/", "results/hdf/", "" |
| OUTPUT_TIMEOUT |  | 60 | lambda timeout value in seconds |
| SERVICE_NAME |  | "saf-lambda-function" | "different-service-name" |

6. Set the required variables: `OUTPUT_BUCKET` and `COMMAND_STRING`.
- Example:
```bash
export OUTPUT_BUCKET="bucket-name"
export COMMAND_STRING="convert ionchannel2hdf -a api-key -t your-team-name"
```
  - NOTE: This version of the lambda function does not handle commands with input flags (i.e. "-i input-file.json").
  - NOTE: Do not include the output flag in the command string. Instead, set the output configuration variables.
  - NOTE: This action does not support `view heimdall`.
  - More examples can be found at [SAF CLI Usage](https://github.com/mitre/saf#usage)
  - You can ensure that the environment variables are set properly: `env`.
7. Set any optional variables that you may want to change. If the default value for any of these variables suffices, it does not need to be set.

## Test and Deploy your SAF CLI Lambda function

### Deploy the service 
8. `serverless deploy --verbose`. This may take several minutes.

### Test by invoking via AWS
9. When the service is deployed successfully, log into the AWS console, go to the "Lamda" interface, and check the logs under the "monitor" tab to see if the function ran at the desired time.
![Screenshot 2022-04-20 at 09-30-41 Functions - Lambda](https://user-images.githubusercontent.com/32680215/164255328-782346f3-689f-458d-8ebe-b3f9af67964a.png)

10. Check the output in your `OUTPUT_BUCKET`.![Screenshot 2022-04-20 at 09-32-39 sls-attempt-three-emcrod - S3 bucket](https://user-images.githubusercontent.com/32680215/164255397-a6b68b51-31da-4228-83eb-bcd5928f315e.png)


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

