/**
 * DFA Minimization — Hopcroft's Algorithm
 * 
 * Minimizes a DFA by merging equivalent states using partition refinement.
 */

import type { DFA, DFAState } from './types';

export function minimizeDFA(dfa: DFA): DFA {
  if (dfa.states.length === 0) {
    return { states: [], startState: 0, acceptStates: [], alphabet: dfa.alphabet };
  }

  const { states, alphabet, acceptStates } = dfa;
  const n = states.length;

  // Build a complete transition table (including dead state if needed)
  // First, check if we need a dead state
  let needsDeadState = false;
  const transTable: number[][] = [];

  // Create transition lookup: stateId × symbolIndex → targetStateId
  const stateById = new Map<number, DFAState>();
  for (const s of states) {
    stateById.set(s.id, s);
  }

  const deadStateId = n; // potential dead state id

  for (let i = 0; i < n; i++) {
    transTable[i] = [];
    const state = states[i];
    for (let si = 0; si < alphabet.length; si++) {
      const sym = alphabet[si];
      const trans = state.transitions.find(t => t.symbol === sym);
      if (trans) {
        // Map the actual state id to its index in the states array
        const targetIdx = states.findIndex(s => s.id === trans.to);
        if (targetIdx === -1) {
          transTable[i][si] = deadStateId;
          needsDeadState = true;
        } else {
          transTable[i][si] = targetIdx;
        }
      } else {
        transTable[i][si] = deadStateId;
        needsDeadState = true;
      }
    }
  }

  // Add dead state row
  const totalStates = needsDeadState ? n + 1 : n;
  if (needsDeadState) {
    transTable[deadStateId] = [];
    for (let si = 0; si < alphabet.length; si++) {
      transTable[deadStateId][si] = deadStateId;
    }
  }

  // Create accept set using indices
  const acceptSet = new Set<number>();
  for (const accId of acceptStates) {
    const idx = states.findIndex(s => s.id === accId);
    if (idx !== -1) acceptSet.add(idx);
  }

  // ─── Hopcroft's partition refinement ─────────────────────────

  // Initial partition: accept states vs non-accept states
  const partition: number[] = new Array(totalStates);
  for (let i = 0; i < totalStates; i++) {
    partition[i] = acceptSet.has(i) ? 0 : 1;
  }

  let numPartitions = 2;
  let changed = true;

  while (changed) {
    changed = false;

    for (let p = 0; p < numPartitions; p++) {
      const statesInPartition = [];
      for (let i = 0; i < totalStates; i++) {
        if (partition[i] === p) statesInPartition.push(i);
      }

      if (statesInPartition.length <= 1) continue;

      // Try to split this partition
      const representative = statesInPartition[0];
      const newGroup: number[] = [];

      for (let i = 1; i < statesInPartition.length; i++) {
        const state = statesInPartition[i];
        let equivalent = true;

        for (let si = 0; si < alphabet.length; si++) {
          const repTarget = transTable[representative][si];
          const stateTarget = transTable[state][si];

          if (partition[repTarget] !== partition[stateTarget]) {
            equivalent = false;
            break;
          }
        }

        if (!equivalent) {
          newGroup.push(state);
        }
      }

      if (newGroup.length > 0) {
        const newPartitionId = numPartitions++;
        for (const s of newGroup) {
          partition[s] = newPartitionId;
        }
        changed = true;
      }
    }
  }

  // ─── Build minimized DFA ──────────────────────────────────────

  // Find which partition each original state belongs to
  const partitionRepresentative = new Map<number, number>(); // partitionId → representative state index
  for (let i = 0; i < totalStates; i++) {
    if (!partitionRepresentative.has(partition[i])) {
      partitionRepresentative.set(partition[i], i);
    }
  }

  // Find the start partition
  const startIdx = states.findIndex(s => s.id === dfa.startState);
  const startPartition = partition[startIdx >= 0 ? startIdx : 0];

  // Remove unreachable partitions via BFS from start
  const reachable = new Set<number>();
  const bfsQueue = [startPartition];
  reachable.add(startPartition);

  while (bfsQueue.length > 0) {
    const p = bfsQueue.shift()!;
    const rep = partitionRepresentative.get(p)!;

    for (let si = 0; si < alphabet.length; si++) {
      if (rep < transTable.length) {
        const target = transTable[rep][si];
        const targetP = partition[target];
        if (!reachable.has(targetP)) {
          reachable.add(targetP);
          bfsQueue.push(targetP);
        }
      }
    }
  }

  // Remove the dead state partition if it's only reachable as a sink
  const deadPartition = needsDeadState ? partition[deadStateId] : -1;

  // Build the minimized states
  const partitionIds = Array.from(reachable).sort((a, b) => a - b);
  // Remove dead state partition if it only has the dead state and is not an accept state
  const filteredPartitionIds = partitionIds.filter(p => {
    if (p === deadPartition) {
      // Keep only if it's reachable and not just a sink
      // Check if any other partition transitions to something other than dead
      const rep = partitionRepresentative.get(p)!;
      if (rep === deadStateId && !acceptSet.has(deadStateId)) {
        return false; // Skip dead state
      }
    }
    return true;
  });

  const partitionToNewId = new Map<number, number>();
  filteredPartitionIds.forEach((p, idx) => partitionToNewId.set(p, idx));

  const newAcceptStates: number[] = [];
  const newStates: DFAState[] = [];

  for (const p of filteredPartitionIds) {
    const rep = partitionRepresentative.get(p)!;
    const newId = partitionToNewId.get(p)!;
    const isAccept = acceptSet.has(rep);

    // Build label from all original states in this partition
    const originalStates: number[] = [];
    for (let i = 0; i < n; i++) {
      if (partition[i] === p) {
        originalStates.push(states[i].id);
      }
    }

    const transitions: { symbol: string; to: number }[] = [];
    for (let si = 0; si < alphabet.length; si++) {
      if (rep < transTable.length) {
        const target = transTable[rep][si];
        const targetP = partition[target];
        if (partitionToNewId.has(targetP)) {
          transitions.push({
            symbol: alphabet[si],
            to: partitionToNewId.get(targetP)!,
          });
        }
      }
    }

    const dfaState: DFAState = {
      id: newId,
      transitions,
      isAccept,
      label: originalStates.length === 1
        ? `q${originalStates[0]}`
        : `{${originalStates.map(x => `q${x}`).join(', ')}}`,
    };

    if (isAccept) {
      newAcceptStates.push(newId);
    }

    newStates.push(dfaState);
  }

  return {
    states: newStates,
    startState: partitionToNewId.get(startPartition) ?? 0,
    acceptStates: newAcceptStates,
    alphabet,
  };
}
