import winston from 'winston';
import 'winston-daily-rotate-file';
import chalk from 'chalk';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// winston.addColors(colors); // Using chalk for more control instead

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
        (info) => {
            const timestamp = chalk.gray(`[${info.timestamp}]`);
            const levelText = info.level.toUpperCase();
            let levelColored;

            switch (info.level) {
                case 'error': levelColored = chalk.red.bold(levelText); break;
                case 'warn': levelColored = chalk.yellow.bold(levelText); break;
                case 'info': levelColored = chalk.green.bold(levelText); break;
                case 'http': levelColored = chalk.magenta.bold(levelText); break;
                case 'debug': levelColored = chalk.white.bold(levelText); break;
                default: levelColored = chalk.cyan.bold(levelText);
            }

            const message = info.message;
            const stack = info.stack ? `\n${chalk.red(info.stack)}` : '';

            return `${timestamp} ${levelColored}: ${message}${stack}`;
        }
    ),
);

const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.json()
);

const transports = [
    new winston.transports.Console({
        format,
    }),
    new winston.transports.DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'error',
        format: fileFormat,
    }),
    new winston.transports.DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
    }),
];

const logger = winston.createLogger({
    level: level(),
    levels,
    transports,
});

export default logger;
