import pino from "pino";

const isDev = process.env.NODE_ENV !== 'production';

export const pinoLogger = pino(
  isDev 
    ? { 
        transport: { 
          target: 'pino-pretty', 
          options: { colorize: true, translateTime: 'SYS:standard' } 
        } 
      } 
    : {}
);
