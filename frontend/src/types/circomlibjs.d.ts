declare module "circomlibjs" {
  export function buildPoseidon(): Promise<{
    F: { toString: (n: unknown) => string };
    (inputs: bigint[]): unknown;
  }>;
}
