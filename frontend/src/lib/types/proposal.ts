export interface Proposal {
  id: number;
  title: string;
  description: string;
  yes_count: number;
  no_count: number;
  end_time: number;
  is_active: boolean;
  merkleRoot?: string;
  /** Eligible voters in the snapshot (from registry). */
  snapshotVoterCount?: number | null;
}
