import { promises as fs } from "fs";
import path from "path";
import type { Proposal } from "@/lib/types/proposal";
import { isProposalActive } from "@/lib/proposal-utils";
import { getVoterCountForRoot } from "@/lib/server/snapshot-registry";

const DATA_DIR = path.join(process.cwd(), ".data");
const STATE_FILE = path.join(DATA_DIR, "activity-state.json");
const EVENTS_FILE = path.join(DATA_DIR, "activity-events.json");

export interface ActivityEvent {
  id: string;
  type: "ballot" | "quorum" | "milestone";
  proposalId: number;
  title: string;
  message: string;
  at: number;
}

interface TrackerState {
  counts: Record<number, number>;
  quorumReached: Record<number, boolean>;
}

interface EventLog {
  events: ActivityEvent[];
}

const DEFAULT_QUORUM = 0.25;

async function loadState(): Promise<TrackerState> {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf8");
    return JSON.parse(raw) as TrackerState;
  } catch {
    return { counts: {}, quorumReached: {} };
  }
}

async function saveState(state: TrackerState) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function loadEvents(): Promise<ActivityEvent[]> {
  try {
    const raw = await fs.readFile(EVENTS_FILE, "utf8");
    return (JSON.parse(raw) as EventLog).events ?? [];
  } catch {
    return [];
  }
}

async function saveEvents(events: ActivityEvent[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(EVENTS_FILE, JSON.stringify({ events: events.slice(0, 50) }, null, 2));
}

export async function refreshActivity(proposals: Proposal[]): Promise<ActivityEvent[]> {
  const state = await loadState();
  const existing = await loadEvents();
  const newEvents: ActivityEvent[] = [];
  const now = Date.now();

  for (const p of proposals) {
    const total = p.yes_count + p.no_count;
    const prev = state.counts[p.id] ?? 0;

    if (total > prev) {
      const delta = total - prev;
      newEvents.push({
        id: `ballot-${p.id}-${total}-${now}`,
        type: "ballot",
        proposalId: p.id,
        title: p.title,
        message:
          delta === 1
            ? `Anonymous ballot recorded on PRV #${p.id.toString().padStart(3, "0")}`
            : `${delta} anonymous ballots on PRV #${p.id.toString().padStart(3, "0")}`,
        at: now,
      });
    }

    if (total > 0 && total % 10 === 0 && total !== prev && total > prev) {
      newEvents.push({
        id: `milestone-${p.id}-${total}-${now}`,
        type: "milestone",
        proposalId: p.id,
        title: p.title,
        message: `PRV #${p.id.toString().padStart(3, "0")} reached ${total} votes`,
        at: now,
      });
    }

    const eligible = await getVoterCountForRoot(p.merkleRoot);
    if (eligible && isProposalActive(p)) {
      const turnout = total / eligible;
      if (turnout >= DEFAULT_QUORUM && !state.quorumReached[p.id]) {
        state.quorumReached[p.id] = true;
        newEvents.push({
          id: `quorum-${p.id}-${now}`,
          type: "quorum",
          proposalId: p.id,
          title: p.title,
          message: `Quorum reached on PRV #${p.id.toString().padStart(3, "0")} (${Math.round(turnout * 100)}% turnout)`,
          at: now,
        });
      }
    }

    state.counts[p.id] = total;
  }

  await saveState(state);

  if (newEvents.length > 0) {
    const merged = [...newEvents, ...existing]
      .sort((a, b) => b.at - a.at)
      .slice(0, 50);
    await saveEvents(merged);
    return merged;
  }

  return existing.sort((a, b) => b.at - a.at).slice(0, 20);
}
