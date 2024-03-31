/* eslint-disable @typescript-eslint/consistent-type-imports */
export function useInternal() {
  return require('lenz/internal') as typeof import('lenz/internal');
}