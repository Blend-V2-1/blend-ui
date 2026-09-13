import { PoolMetadata, Version } from '@blend-capital/blend-sdk';

export enum PoolDeployment {
  V1 = 'V1',
  V2 = 'V2',
  V21 = 'V2.1',
}

export type PoolDeploymentLike = PoolDeployment | Version;

export const BACKSTOP_ID_V21 = process.env.NEXT_PUBLIC_BACKSTOP_V21 || '';

export interface PoolMeta extends PoolMetadata {
  id: string;
  version: Version;
  deployment: PoolDeployment;
}

export function getPoolDeployment(
  pool: { deployment?: PoolDeployment; version?: Version; backstop?: string } | undefined
): PoolDeployment | undefined {
  if (pool?.deployment !== undefined) return pool.deployment;
  if (pool?.backstop === BACKSTOP_ID_V21 && BACKSTOP_ID_V21 !== '') return PoolDeployment.V21;
  if (pool?.version === Version.V1) return PoolDeployment.V1;
  if (pool?.version === Version.V2) return PoolDeployment.V2;
  return undefined;
}

export function getBackstopId(deployment: PoolDeploymentLike | undefined): string {
  if (deployment === PoolDeployment.V21) return BACKSTOP_ID_V21;
  if (deployment === PoolDeployment.V2 || deployment === Version.V2) {
    return process.env.NEXT_PUBLIC_BACKSTOP_V2 || '';
  }
  return process.env.NEXT_PUBLIC_BACKSTOP || '';
}

export function getEmissionSymbol(deployment: PoolDeploymentLike | undefined): 'BLND' | 'BLNT' {
  return deployment === PoolDeployment.V21 ? 'BLNT' : 'BLND';
}

export const NOT_BLEND_POOL_ERROR_MESSAGE = 'NOT_BLEND_POOL';
