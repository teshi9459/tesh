const axios = require("axios");
const { setTimeout: delay } = require("node:timers/promises");
const promClient = require("prom-client");
const logger = require("./logger.js");

const API_URL = process.env.API_URL;
const BOT_SECRET = process.env.BOT_SECRET;
const API_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS ?? 5000);
const API_RETRY_ATTEMPTS = Number(process.env.API_RETRY_ATTEMPTS ?? 3);
const API_RETRY_DELAY_MS = Number(process.env.API_RETRY_DELAY_MS ?? 300);
const API_RATE_LIMIT_CAP = Number(process.env.API_RATE_LIMIT_CAP ?? 10);
const API_RATE_LIMIT_INTERVAL_MS = Number(
  process.env.API_RATE_LIMIT_INTERVAL_MS ?? 1000
);
const API_CONCURRENCY = Number(process.env.API_CONCURRENCY ?? 4);

const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    Authorization: `Bot ${BOT_SECRET}`,
    "Content-Type": "application/json",
    "User-Agent": "TeshBot-Discord/1.0",
  },
});

class RateLimiter {
  constructor({ maxRequests, interval, concurrency }) {
    this.maxRequests = Math.max(Number(maxRequests) || 1, 1);
    this.interval = Math.max(Number(interval) || 1, 1);
    this.concurrency = Math.max(Number(concurrency) || 1, 1);
    this.active = 0;
    this.issuedInWindow = 0;
    this.windowStart = Date.now();
    this.queue = [];
    this.timer = null;
  }

  schedule(fn) {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          this.active += 1;
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.active -= 1;
          this.process();
        }
      };
      this.queue.push(task);
      this.process();
    });
  }

  process() {
    const now = Date.now();
    if (now - this.windowStart >= this.interval) {
      this.windowStart = now;
      this.issuedInWindow = 0;
    }

    while (
      this.queue.length &&
      this.active < this.concurrency &&
      this.issuedInWindow < this.maxRequests
    ) {
      const task = this.queue.shift();
      this.issuedInWindow += 1;
      setImmediate(task);
    }

    if (this.queue.length && this.issuedInWindow >= this.maxRequests) {
      const wait = Math.max(
        this.interval - (Date.now() - this.windowStart),
        0
      );
      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.timer = null;
          this.process();
        }, wait);
        if (typeof this.timer.unref === "function") {
          this.timer.unref();
        }
      }
    }
  }
}

const rateLimiter = new RateLimiter({
  maxRequests: API_RATE_LIMIT_CAP,
  interval: API_RATE_LIMIT_INTERVAL_MS,
  concurrency: API_CONCURRENCY,
});

const register = new promClient.Registry();
promClient.collectDefaultMetrics({
  prefix: "teshbot_",
  register,
});

const requestCounter = new promClient.Counter({
  name: "brain_api_requests_total",
  help: "Anzahl der Brain-API Anfragen",
  labelNames: ["method", "status"],
  registers: [register],
});

const requestDuration = new promClient.Histogram({
  name: "brain_api_request_duration_seconds",
  help: "Dauer von Brain-API Anfragen",
  labelNames: ["method", "status"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register],
});

class BrainApiError extends Error {
  constructor(message, { status, code, data, userMessage } = {}) {
    super(message);
    this.name = "BrainApiError";
    this.status = status;
    this.code = code;
    this.data = data;
    this.userMessage = userMessage;
  }
}

function isRetryable(error) {
  const status = error?.response?.status;
  const code = error?.code;
  if (status) {
    if (status === 408 || status === 425 || status === 429) return true;
    if (status >= 500) return true;
    return false;
  }
  if (!code) return true;
  return [
    "ECONNRESET",
    "ECONNABORTED",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EAI_AGAIN",
  ].includes(code);
}

function buildUserMessage(error, explicit) {
  if (explicit) return explicit;
  const status = error?.response?.status;
  const code = error?.code;
  const payload = error?.response?.data;

  if (status === 400 && payload?.message) return String(payload.message);
  if (status === 403) return "Dir fehlt die Berechtigung für diese Aktion.";
  if (status === 404) return "Der angeforderte Eintrag wurde nicht gefunden.";
  if (status === 409) return "Dieser Vorgang steht in Konflikt mit dem aktuellen Status.";
  if (status === 422 && payload?.message)
    return String(payload.message);
  if (status && status >= 500)
    return "Der Brain-Dienst hat gerade Schwierigkeiten. Bitte versuch es später erneut.";
  if (code === "ECONNABORTED" || code === "ETIMEDOUT")
    return "Die Anfrage an das Brain-Backend hat zu lange gedauert.";
  return "Die Brain-API konnte die Anfrage nicht verarbeiten.";
}

function toBrainApiError(error, meta) {
  const status = error?.response?.status;
  const code = error?.code;
  const data = error?.response?.data;
  const userMessage = buildUserMessage(error, meta.userMessage);
  const message = `[BrainAPI] ${meta.method} ${meta.url} fehlgeschlagen`;
  const err = new BrainApiError(message, { status, code, data, userMessage });

  logger.error(
    {
      method: meta.method,
      url: meta.url,
      status,
      code,
      attempt: meta.attempt,
      attempts: meta.attempts,
      data,
      error: error?.message,
    },
    "Brain-API Anfrage endgültig fehlgeschlagen"
  );

  return err;
}

async function request(config, options = {}) {
  const attempts = Math.max(Number(options.attempts) || API_RETRY_ATTEMPTS, 1);
  const retryDelayMs = Math.max(
    Number(options.retryDelayMs) || API_RETRY_DELAY_MS,
    0
  );
  const method = (config.method || "get").toUpperCase();
  const url = config.url || config.baseURL || "unknown";

  return rateLimiter.schedule(async () => {
    let attempt = 0;
    const endTimer = requestDuration.startTimer({ method, status: "in_flight" });

    while (attempt < attempts) {
      attempt += 1;
      try {
        const response = await api.request({
          timeout: API_TIMEOUT_MS,
          ...config,
          method: method.toLowerCase(),
        });
        requestCounter.inc({ method, status: response.status });
        endTimer({ status: response.status });
        return response.data;
      } catch (error) {
        const statusLabel = error?.response?.status ?? error?.code ?? "ERR";
        const retryable = isRetryable(error);
        if (attempt >= attempts || !retryable) {
          requestCounter.inc({ method, status: statusLabel });
          endTimer({ status: statusLabel });
          throw toBrainApiError(error, {
            method,
            url,
            attempt,
            attempts,
            userMessage: options.userMessage,
          });
        }

        requestCounter.inc({ method, status: "retry" });
        endTimer({ status: "retry" });
        const wait = retryDelayMs * attempt;
        logger.warn(
          {
            method,
            url,
            attempt,
            attempts,
            status: statusLabel,
            wait,
          },
          "Brain-API Anfrage fehlgeschlagen, erneuter Versuch"
        );
        await delay(wait);
      }
    }

    // sollte nie erreicht werden
    throw new BrainApiError(
      `[BrainAPI] ${method} ${url} wurde ohne Ergebnis verlassen`,
      { userMessage: "Die Anfrage konnte nicht abgeschlossen werden." }
    );
  });
}

function get(url, config = {}, options = {}) {
  return request({ ...config, method: "get", url }, options);
}

function post(url, data, config = {}, options = {}) {
  return request({ ...config, method: "post", url, data }, options);
}

function patch(url, data, config = {}, options = {}) {
  return request({ ...config, method: "patch", url, data }, options);
}

function del(url, config = {}, options = {}) {
  return request({ ...config, method: "delete", url }, options);
}

const brainApi = { request, get, post, patch, delete: del };

module.exports = {
  api,
  brainApi,
  request,
  get,
  post,
  patch,
  del,
  BrainApiError,
  metricsRegister: register,
  requestCounter,
  requestDuration,
};
