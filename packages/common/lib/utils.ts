import BN from "bn.js";

import { ContractError } from "../types.js";

/**
 * Used for conversion of token amounts to their Big Number representation.
 * Get Big Number representation in the smallest units from the same value in the highest units.
 * @param {number} value - Number of tokens you want to convert to its BN representation.
 * @param {number} decimals - Number of decimals the token has.
 */
export const getBN = (value: number, decimals: number): BN => {
  const decimalPart = value - Math.trunc(value);
  const integerPart = new BN(Math.trunc(value));

  const decimalE = new BN(decimalPart * 1e9);

  const sum = integerPart.mul(new BN(1e9)).add(decimalE);
  const resultE = sum.mul(new BN(10).pow(new BN(decimals)));
  return resultE.div(new BN(1e9));
};

/**
 * Used for token amounts conversion from their Big Number representation to number.
 * Get value in the highest units from BN representation of the same value in the smallest units.
 * @param {BN} value - Big Number representation of value in the smallest units.
 * @param {number} decimals - Number of decimals the token has.
 */
export const getNumberFromBN = (value: BN, decimals: number): number =>
  value.gt(new BN(2 ** 53 - 1)) ? value.div(new BN(10 ** decimals)).toNumber() : value.toNumber() / 10 ** decimals;

/**
 * Type guard to check if a value is an Error instance
 * @param value - The value to check
 * @returns true if the value is an Error
 */

function isError(value: unknown): value is Error {
  return value instanceof Error ||
    (typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      typeof (value as any).message === 'string');
}

/**
 * Converts unknown error values to Error instances
 * @param err - The unknown error value
 * @returns An Error instance
 */
function toError(err: unknown): Error {
  if (isError(err)) {
    return err;
  }

  // Handle different types of thrown values
  if (typeof err === 'string') {
    return new Error(err);
  }
  if (typeof err === 'object' && err !== null) {
    try {
      return new Error(JSON.stringify(err));
    } catch {
      return new Error('Unknown object error');
    }
  }

  return new Error(`Unknown error: ${String(err)}`);
}

/**
 * Used to make on chain calls to the contract and wrap raised errors if any
 * @param func function that interacts with the contract
 * @param callback callback that may be used to extract error code
 * @returns {T}
 */
export async function handleContractError<T>(
  func: () => Promise<T>,
  callback?: (err: Error) => string | null,
): Promise<T> {
  try {
    return await func();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: unknown) {
    const errorInstance = toError(err);

    if (callback) {
      throw new ContractError(errorInstance, callback(errorInstance));
    }
    throw new ContractError(errorInstance);
  }
}

/**
 * Pause async function execution for given amount of milliseconds
 * @param ms millisecond to sleep for
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const divCeilN = (n: bigint, d: bigint): bigint => n / d + (n % d ? BigInt(1) : BigInt(0));
