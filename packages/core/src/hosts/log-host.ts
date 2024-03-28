/* eslint-disable @typescript-eslint/no-explicit-any */
import EventHost, { createAppEvent } from './event-host';

export enum LogLevel {
  Log = 'log',
  Warn = 'warn',
  Error = 'error',
  Info = 'info',
  Debug = 'debug'
}

export interface AppLog {
  level: LogLevel
  args: any[]
  dateTime: Date
}

/**
 * Dispara um evento de log e chama a função de log correspondente ao nível.
 * @param level Nível do log.
 * @param args Argumentos do log.
 */
export function dispatch(level: LogLevel, ...args: any[]) {
  const log: AppLog = {
    level,
    args,
    dateTime: new Date(),
  }

    // Chama a função de log correspondente ao nível
    ; ({
      [LogLevel.Log]: console.log,
      [LogLevel.Warn]: console.warn,
      [LogLevel.Error]: console.error,
      [LogLevel.Info]: console.info,
      [LogLevel.Debug]: console.debug,
    })[level](...args);

  EventHost.emit(createAppEvent('log'), log);
  EventHost.emit(createAppEvent(`log:${level}`), log);
}

/**
 * Registra um log no nível `log`.
 * @param args Argumentos do log.
 */
export function log(...args: any[]) {
  return dispatch(LogLevel.Log, ...args);
}

/**
 * Registra um log no nível `warn`.
 * @param args Argumentos do log.
 */
export function warn(...args: any[]) {
  return dispatch(LogLevel.Warn, ...args);
}

/**
 * Registra um log no nível `error`.
 * @param args Argumentos do log.
 */
export function error(...args: any[]) {
  return dispatch(LogLevel.Error, ...args);
}

/**
 * Registra um log no nível `info`.
 * @param args Argumentos do log.
 */
export function info(...args: any[]) {
  return dispatch(LogLevel.Info, ...args);
}

/**
 * Registra um log no nível `debug`.
 * @param args Argumentos do log.
 */
export function debug(...args: any[]) {
  return dispatch(LogLevel.Debug, ...args);
}

/**
 * Host de logs do editor.
 */
export default {
  dispatch,
  log,
  warn,
  error,
  info,
  debug,
};
