# saf-lambda-function
This code uses the Serverless Framework to deploy an AWS lambda function that, when triggered by a file uploaded in an S3 bucket, will run the [SAF CLI](https://github.com/mitre/saf) with the given input command (`COMMAND_STRING_INPUT`).

## To Use
### Follow the example-specific instructions below:
1. Clone this repository: `git clone https://github.com/mitre/saf-lambda-function.git`
2. Install the Serverless Framework: `npm install -g serverless`
3. Install the latest dependencies: `npm install`.
4. Configure your AWS credentials. [Recommended method](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) is to add a profile in the `~/.aws/credentials` file and then export that profile:
```bash
export AWS_PROFILE=<your_creds_profile_name>

# To ensure your access to AWS, run:
aws s3 ls
```
5. Set the S3 bucket name that you would like to upload your HDF file to
```bash
export BUCKET=<bucket-name>
```
6. Set the SAF CLI command environment variable. This lambda function will run `saf <command_string> -i input_file_from_bucket.json` 
Example:
```bash
export COMMAND_STRING_INPUT="convert hdf2splunk -H 127.0.0.1 -u admin -p Valid_password! -I your_index_name"
```
  - More examples can be found at [SAF CLI Usage](https://github.com/mitre/saf#usage)
  - NOTE: Do not include the input flag in the command string as this will be appended on from the S3 bucket trigger, ex: "-i hdf_file.json".
  - NOTE: This action does not support `view heimdall`.

7. Ensure that the environment variables are set properly: `env`
8. Deploy the service: `sls deploy --verbose`
9. When the service is deployed successfully, log into the AWS console, go to the "Lamda" interface, and set the S3 bucket as the trigger.
10. You can test the service by uploading your input file into the `bucket-name` that your exported in step 2.


### Expected Output
The service will run `saf <COMMAND_STRING_INPUT> -i <latest_file_from_bucket>` and the output will be determined by that command.
For example, for the `convert hdf2splunk` command, the service will convert the uploaded HDF file and send the data to your Splunk instance.


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

