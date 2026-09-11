import morgan from 'morgan';
import logger from '../utils/logger.js';
import chalk from 'chalk';

const stream = {
    write: (message) => logger.http(message.trim()),
};

const skip = () => {
    const env = process.env.NODE_ENV || 'development';
    return env !== 'development';
};

morgan.token('statusColored', (req, res) => {
    const status = res.statusCode;
    if (status >= 500) return chalk.red(status);
    if (status >= 400) return chalk.yellow(status);
    if (status >= 300) return chalk.cyan(status);
    if (status >= 200) return chalk.green(status);
    return status;
});

morgan.token('methodColored', (req) => {
    const method = req.method;
    switch (method) {
        case 'GET': return chalk.blue.bold(method);
        case 'POST': return chalk.green.bold(method);
        case 'PUT': return chalk.yellow.bold(method);
        case 'DELETE': return chalk.red.bold(method);
        default: return chalk.white.bold(method);
    }
});

const morganMiddleware = morgan(
    ':methodColored :url :statusColored :response-time ms - :res[content-length]',
    { stream, skip }
);

export default morganMiddleware;
