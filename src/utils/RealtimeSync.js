import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LedgerEngine } from './LedgerEngine';
import { SupabaseRepository } from './SupabaseRepository';

let isInitialized = false;
let activeEventSource = null;
let activeChannel = null;
let pollingTimer = null;

export function initRealtimeSync() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  console.log('[RealtimeSync] Initializing real-time transaction engine (Supabase + SSE + Sync Poller)...');

  // 1. SUPABASE REALTIME (Postgres Changes)
  try {
    if (supabase && typeof supabase.channel === 'function') {
      activeChannel = supabase
        .channel('realtime:ledger-transactions')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'transactions' },
          async (payload) => {
            const leg = payload.new;
            if (!leg) return;

            try {
              const { data: jv } = await supabase
                .from('journal_vouchers')
                .select('date, narration, ref, category, created_at')
                .eq('id', leg.journal_voucher_id)
                .single();

              const tx = {
                id: leg.id,
                date: jv?.date || new Date().toISOString().split('T')[0],
                account: leg.account_name,
                amount: Number(leg.amount),
                type: leg.type,
                narration: jv?.narration || 'Payment Settlement',
                ref: jv?.ref || `RZP-${Date.now()}`,
                category: jv?.category || 'Receipts',
                createdAt: jv?.created_at || new Date().toISOString(),
                __new: true
              };

              const added = LedgerEngine.ingestIncomingTransaction(tx);
              if (added) {
                console.log('[RealtimeSync] Supabase real-time transaction ingested:', tx.ref, tx.amount);
                window.dispatchEvent(new CustomEvent('transaction-received', { detail: tx }));
                window.dispatchEvent(new Event('ledger-updated'));
              }
            } catch (e) {
              console.warn('[RealtimeSync] Error processing Supabase transaction:', e);
            }
          }
        )
        .subscribe((status) => {
          console.log('[RealtimeSync] Supabase channel status:', status);
        });
    }
  } catch (err) {
    console.warn('[RealtimeSync] Supabase Realtime subscription error:', err);
  }

  // 2. BACKEND SSE CONNECTION
  try {
    const backendUrl =
      process.env.REACT_APP_BACKEND_URL?.replace(/\/+$/, '') ||
      'http://127.0.0.1:8001';

    const connectSSE = () => {
      if (activeEventSource) {
        activeEventSource.close();
      }
      activeEventSource = new EventSource(`${backendUrl}/api/webhooks/stream/transactions`);

      activeEventSource.addEventListener('new_transaction', (e) => {
        try {
          const raw = JSON.parse(e.data);
          const tx = {
            id: raw.id || `SSE-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            date: raw.date || new Date().toISOString().split('T')[0],
            account: raw.account || raw.account_name,
            amount: Number(raw.amount) || 0,
            type: raw.type || 'Debit',
            narration: raw.narration || '',
            ref: raw.ref || `RZP-${Date.now()}`,
            category: raw.category || 'Receipts',
            createdAt: raw.createdAt || new Date().toISOString(),
            __new: true
          };

          const added = LedgerEngine.ingestIncomingTransaction(tx);
          if (added) {
            console.log('[RealtimeSync] SSE transaction ingested:', tx.ref, tx.amount);
            window.dispatchEvent(new CustomEvent('transaction-received', { detail: tx }));
            window.dispatchEvent(new Event('ledger-updated'));
          }
        } catch (parseErr) {
          console.error('[RealtimeSync] SSE parse error:', parseErr);
        }
      });

      activeEventSource.onerror = () => {
        // Reconnect after brief pause if disconnected
        setTimeout(() => {
          if (isInitialized && activeEventSource?.readyState === EventSource.CLOSED) {
            connectSSE();
          }
        }, 5000);
      };
    };

    connectSSE();
  } catch (sseErr) {
    console.warn('[RealtimeSync] SSE setup warning:', sseErr);
  }

  // 3. BACKGROUND SYNC POLLER (Safety Net)
  // Polls Supabase every 3.5s for any recently inserted transactions
  const pollRecent = async () => {
    try {
      const isConfigured =
        process.env.REACT_APP_SUPABASE_URL &&
        !process.env.REACT_APP_SUPABASE_URL.includes('placeholder');
      if (!isConfigured) return;

      const loaded = await SupabaseRepository.loadTransactions();
      if (loaded && loaded.length > 0) {
        let hasNew = false;
        loaded.forEach((tx) => {
          const wasAdded = LedgerEngine.ingestIncomingTransaction(tx);
          if (wasAdded) {
            hasNew = true;
            window.dispatchEvent(new CustomEvent('transaction-received', { detail: { ...tx, __new: true } }));
          }
        });
        if (hasNew) {
          console.log('[RealtimeSync] Poller discovered and ingested new transactions');
          window.dispatchEvent(new Event('ledger-updated'));
        }
      }
    } catch (pollErr) {
      // silent
    }
  };

  pollingTimer = setInterval(pollRecent, 3500);
}

/**
 * React Hook for components (like Day Book) to receive live transactions
 */
export function useRealtimeTransactions(onNewTx) {
  useEffect(() => {
    initRealtimeSync();

    const handleTx = (e) => {
      if (e.detail && onNewTx) {
        onNewTx(e.detail);
      }
    };

    window.addEventListener('transaction-received', handleTx);
    return () => {
      window.removeEventListener('transaction-received', handleTx);
    };
  }, [onNewTx]);
}
