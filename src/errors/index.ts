export class AnchorKitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnchorKitError';
  }
}

export class AnchorNotFoundError extends AnchorKitError {
  constructor(homeDomain: string) {
    super(`Anchor not found or unreachable: ${homeDomain}`);
    this.name = 'AnchorNotFoundError';
  }
}

export class UnsupportedSepError extends AnchorKitError {
  constructor(homeDomain: string, sep: string) {
    super(`${homeDomain} does not support ${sep}`);
    this.name = 'UnsupportedSepError';
  }
}

export class Sep10AuthError extends AnchorKitError {
  constructor(message: string) {
    super(`SEP-10 authentication failed: ${message}`);
    this.name = 'Sep10AuthError';
  }
}

export class TransactionPollTimeoutError extends AnchorKitError {
  constructor(id: string, timeoutMs: number) {
    super(`Transaction ${id} did not reach a terminal state within ${timeoutMs}ms`);
    this.name = 'TransactionPollTimeoutError';
  }
}

export class NoHealthyAnchorError extends AnchorKitError {
  constructor() {
    super('No healthy anchors available');
    this.name = 'NoHealthyAnchorError';
  }
}
