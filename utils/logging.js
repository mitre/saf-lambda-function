/*
 * NOTICE
 * This software was produced for the U.S. Government and is subject to the
 * Rights in Data-General Clause 5.227-14 (May 2014).
 * Copyright 2018 The MITRE Corporation. All rights reserved.
 * Approved for Public Release; Distribution Unlimited. Case 18-2165
 *
 * This project contains content developed by The MITRE Corporation.
 * If this code is used in a deployment or embedded within another project,
 * it is requested that you send an email to opensource@mitre.org
 * in order to let us know where this software is being used.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/*
const winston = require('winston');
const { createLogger, format, transports } = winston;


const handler = async (event, context) => {
    context.awsRequestId = undefined;
    let logger;
    return logger = createLogger({
        level: process.env.LOG_LEVEL || 'debug',
        format: format.combine(
            format.timestamp(),
            format.simple()
        ),
        transports: [
            new transports.Console({
                format: format.combine(
                    format.timestamp({
                        format: 'YYYY-MM-DDTHH:mm:ss.fff',
                    }),
                    format.printf(
                        info => `[${[info.timestamp]}] ${context.awsRequestId} ${info.message}`,
                    )
                )
            })
        ]
    })
};
*/
/*const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});


export const handler = async (event, context) => {
    logger.defaultMeta = {requestId: context.awsRequestId};

    logger.info('Your log here', {data: 42});
};

 */


/*const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'INFO',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});


export const handler = async (event, context) => {
    logger.defaultMeta = {requestId: context.awsRequestId};

    logger.info('Your log here', {data: 42});
};


export const createWinstonLogger = (
    level:  "INFO"
) => winston.createLogger({
    transports: [new winston.transports.Console()],
    level: level,
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'MMM-DD-YYYY HH:mm:ss Z',
        }),
        winston.format.printf(
            info => `[${[info.timestamp]}] ${info.message}`,
        ),
    ),
});

*/
