import { useRealtimeTransactions } from './RealtimeSync';

/**
 * Backwards-compatible hook that connects to the RealtimeSync engine
 * (Powered by Supabase Realtime + Backend SSE + Safety Poller)
 */
export function useTransactionStream(onNewTx) {
  return useRealtimeTransactions(onNewTx);
}
