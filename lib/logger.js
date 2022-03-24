const winston = require('winston');

function createWinstonLogger(awsRequestId, log_level) {
    return winston.createLogger({
        level: log_level,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.simple()
        ),
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp({
                        format: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
                    }),
                    winston.format.printf(
                        info => `${[info.timestamp]}\t${awsRequestId}\t${log_level.toUpperCase()}\t${info.message}`,
                    )
                )
            })
        ]
    });
}

module.exports = {
    createWinstonLogger,
};
