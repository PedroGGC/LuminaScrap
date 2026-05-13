export interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class ScrapeError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'ScrapeError';
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeout = 30000, retries = 2, retryDelay = 1000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok && isRetryableStatus(response.status)) {
        throw new ScrapeError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          true
        );
      }

      return response;
    } catch (error) {
      if (attempt === retries) {
        clearTimeout(timeoutId);
        throw error;
      }

      await sleep(retryDelay * Math.pow(2, attempt));
    }
  }

  clearTimeout(timeoutId);
  throw new ScrapeError('Max retries exceeded', undefined, false);
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}