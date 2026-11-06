import { useState, useRef, useEffect, useCallback } from 'react';
import type { ClubSimulationResult } from '../lib/sim/engine';
import { runSimulation } from '../lib/sim/engine';
import type { UCLSimulationData } from '@/types/ucl';
import type {
  WhatIfRunMessage,
  WhatIfOutgoingMessage,
} from '../workers/whatif.worker';

export interface WhatIfSimulationResults {
  baseline: Record<string, ClubSimulationResult>;
  scenario: Record<string, ClubSimulationResult>;
  elapsedMs: number;
}

export function useWhatIf(data: UCLSimulationData) {
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WhatIfSimulationResults | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  // Initialize or re-create worker
  const initWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    try {
      const worker = new Worker(
        new URL('../workers/whatif.worker.ts', import.meta.url),
        { type: 'module' },
      );
      worker.onmessage = (event: MessageEvent<WhatIfOutgoingMessage>) => {
        const msg = event.data;
        if (msg.id !== activeRequestIdRef.current) return;

        if (msg.type === 'progress') {
          setProgress(Math.round(msg.progress * 100));
        } else if (msg.type === 'success') {
          setResult({
            baseline: msg.baseline,
            scenario: msg.scenario,
            elapsedMs: msg.elapsed_ms,
          });
          setIsSimulating(false);
          setProgress(100);
        } else if (msg.type === 'error') {
          setError(msg.error);
          setIsSimulating(false);
        }
      };

      worker.onerror = (err) => {
        console.error('WhatIf worker error:', err);
        setError('Gagal menjalankan worker simulasi.');
        setIsSimulating(false);
      };

      workerRef.current = worker;
      return worker;
    } catch (e) {
      console.warn('Worker initialization failed, fallback to main thread:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    initWorker();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [initWorker]);

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'cancel',
        id: activeRequestIdRef.current,
      });
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsSimulating(false);
    setProgress(0);
    initWorker();
  }, [initWorker]);

  const run = useCallback(
    (overrides: Record<number, [number, number]>, N: number, seed = 42) => {
      const requestId = activeRequestIdRef.current + 1;
      activeRequestIdRef.current = requestId;

      setIsSimulating(true);
      setProgress(5);
      setError(null);

      const worker = workerRef.current || initWorker();

      if (worker) {
        const message: WhatIfRunMessage = {
          type: 'run',
          id: requestId,
          current_table: data.current_table,
          remaining_fixtures: data.remaining_fixtures,
          overrides,
          N,
          seed,
          p_stage_given_rank: data.p_stage_given_rank,
        };
        worker.postMessage(message);
      } else {
        // Fallback synchronous execution on main thread
        try {
          const t0 = performance.now();
          const baseline = runSimulation({
            current_table: data.current_table,
            remaining_fixtures: data.remaining_fixtures,
            overrides: {},
            N,
            seed,
            p_stage_given_rank: data.p_stage_given_rank,
          });
          const scenario = runSimulation({
            current_table: data.current_table,
            remaining_fixtures: data.remaining_fixtures,
            overrides,
            N,
            seed,
            p_stage_given_rank: data.p_stage_given_rank,
          });
          setResult({
            baseline: baseline.results,
            scenario: scenario.results,
            elapsedMs: performance.now() - t0,
          });
          setIsSimulating(false);
          setProgress(100);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
          setIsSimulating(false);
        }
      }
    },
    [data, initWorker],
  );

  return {
    isSimulating,
    progress,
    error,
    result,
    run,
    cancel,
  };
}
