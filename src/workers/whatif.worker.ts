import { runSimulation, type ClubSimulationResult } from '../lib/sim/engine';
import type { CurrentTableEntry, RemainingFixture, StageGivenRank } from '@/types/ucl';

export interface WhatIfRunMessage {
  type: 'run';
  id: number;
  current_table: Record<string, CurrentTableEntry>;
  remaining_fixtures: RemainingFixture[];
  overrides: Record<number, [number, number]>;
  N: number;
  seed: number;
  p_stage_given_rank?: Record<string, StageGivenRank[]>;
}

export interface WhatIfCancelMessage {
  type: 'cancel';
  id: number;
}

export type WhatIfIncomingMessage = WhatIfRunMessage | WhatIfCancelMessage;

export interface WhatIfProgressResponse {
  type: 'progress';
  id: number;
  progress: number; // 0.0 - 1.0
}

export interface WhatIfSuccessResponse {
  type: 'success';
  id: number;
  baseline: Record<string, ClubSimulationResult>;
  scenario: Record<string, ClubSimulationResult>;
  elapsed_ms: number;
}

export interface WhatIfErrorResponse {
  type: 'error';
  id: number;
  error: string;
}

export type WhatIfOutgoingMessage =
  | WhatIfProgressResponse
  | WhatIfSuccessResponse
  | WhatIfErrorResponse;

const cancelledIds = new Set<number>();

self.onmessage = (event: MessageEvent<WhatIfIncomingMessage>) => {
  const data = event.data;

  if (data.type === 'cancel') {
    cancelledIds.add(data.id);
    return;
  }

  if (data.type === 'run') {
    const { id, current_table, remaining_fixtures, overrides, N, seed, p_stage_given_rank } = data;
    try {
      if (cancelledIds.has(id)) {
        cancelledIds.delete(id);
        return;
      }

      self.postMessage({
        type: 'progress',
        id,
        progress: 0.1,
      } satisfies WhatIfProgressResponse);

      // Run baseline with empty overrides using same seed and N
      const baselineOutput = runSimulation({
        current_table,
        remaining_fixtures,
        overrides: {},
        N,
        seed,
        p_stage_given_rank,
      });

      if (cancelledIds.has(id)) {
        cancelledIds.delete(id);
        return;
      }

      self.postMessage({
        type: 'progress',
        id,
        progress: 0.6,
      } satisfies WhatIfProgressResponse);

      // Run scenario with active overrides
      const scenarioOutput = runSimulation({
        current_table,
        remaining_fixtures,
        overrides,
        N,
        seed,
        p_stage_given_rank,
      });

      if (cancelledIds.has(id)) {
        cancelledIds.delete(id);
        return;
      }

      self.postMessage({
        type: 'progress',
        id,
        progress: 1.0,
      } satisfies WhatIfProgressResponse);

      self.postMessage({
        type: 'success',
        id,
        baseline: baselineOutput.results,
        scenario: scenarioOutput.results,
        elapsed_ms: baselineOutput.elapsed_ms + scenarioOutput.elapsed_ms,
      } satisfies WhatIfSuccessResponse);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      self.postMessage({
        type: 'error',
        id,
        error: message,
      } satisfies WhatIfErrorResponse);
    }
  }
};
