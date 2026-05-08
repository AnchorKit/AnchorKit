declare module 'toml' {
  export function parse(input: string): Record<string, unknown>;
  export function stringify(obj: Record<string, unknown>): string;
}
