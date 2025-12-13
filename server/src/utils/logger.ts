import { consola } from "consola";
import { t, type I18nParams } from "../i18n/i18n";

const level = process.env.NODE_ENV === "development" ? 7 : 5; // debug : info
const base = consola.create({ level }).withTag("server");

/**
 * Единый logger (красивый вывод через consola).
 * Поддерживает как «готовые строки», так и ключи i18n.
 */
export const logger = {
  info: (message: string, ...args: any[]): void => {
    base.info(message, ...args);
  },
  infoKey: (key: string, params?: I18nParams, ...args: any[]): void => {
    base.info(t(key, params), ...args);
  },

  warn: (message: string, ...args: any[]): void => {
    base.warn(message, ...args);
  },
  warnKey: (key: string, params?: I18nParams, ...args: any[]): void => {
    base.warn(t(key, params), ...args);
  },

  debug: (message: string, ...args: any[]): void => {
    base.debug(message, ...args);
  },
  debugKey: (key: string, params?: I18nParams, ...args: any[]): void => {
    base.debug(t(key, params), ...args);
  },

  error: (error: unknown, message?: string, ...args: any[]): void => {
    if (message) {
      base.error(message, error, ...args);
      return;
    }
    base.error(error, ...args);
  },
  errorMessage: (message: string, ...args: any[]): void => {
    base.error(message, ...args);
  },
  errorKey: (
    error: unknown,
    key: string,
    params?: I18nParams,
    ...args: any[]
  ): void => {
    base.error(t(key, params), error, ...args);
  },
  errorMessageKey: (key: string, params?: I18nParams, ...args: any[]): void => {
    base.error(t(key, params), ...args);
  },
};
