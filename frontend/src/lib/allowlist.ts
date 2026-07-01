/**
 * allowlist.ts
 * The registered voter roster for the demo.
 */

export interface AllowlistEntry {
  address: string;
  label: string;
  identityIndex: number;
  secret?: string;
}

/** Privora admin / reviewer wallet — can approve submissions in the UI. */
export const ADMIN_WALLET =
  process.env.NEXT_PUBLIC_ADMIN_WALLET ||
  "GDCYHMPLBJCLSVKJWVYYSWDUDHUCAUV7Y2CWFE67XTCW35EG47QM276X";

export const ALLOWLIST: AllowlistEntry[] = [
  {
    address: "GDCYHMPLBJCLSVKJWVYYSWDUDHUCAUV7Y2CWFE67XTCW35EG47QM276X",
    label: "Proposer · Voter 1",
    identityIndex: 0,
  },
  {
    address: "GBX6VOHHHKE4LMEIECXSJMSZGPY3YZE4XKEELNOIJRRH2BVAGJ2RP3W2",
    label: "Voter 2",
    identityIndex: 1,
    secret: "SBSAXIRS4JXPR3T3DLYJAIAN7KMEY7D55OLNZJKV5EIRFDNG7POGVPZY",
  },
  {
    address: "GDQ2TQ5Z2DLKWI4RLSNAWXF4UCQUIODB5A6NU2HL2UEOXZ3OT7PFQXXT",
    label: "Voter 3",
    identityIndex: 2,
    secret: "SDBD5YKYLXSLU37KFX5JW4ICMNOTGJVW37YJKIKHKDKASDFOW7JHL23R",
  },
  {
    address: "GDL2SPF6LOOTHQEY7XLUGC6NQ6V42J7AMMAVXKQMJGSPABPOCRZV37XR",
    label: "Voter 4",
    identityIndex: 3,
    secret: "SD5ZVX5X74HZ36K25BJM34M6EA3CMT3C5HEM76DBHSBODAPQZILPSZK4",
  },
  {
    address: "GAX7Z3AQAJZ6OWI722XCWJXIUL5Z5BFKT7CWI5RP7OLJSIS4K6IUBXUY",
    label: "Voter 5",
    identityIndex: 4,
    secret: "SBIK2P3UT73RKP752CTWSLEGP4YDJ5G4X672425EAULFAGJGB4363LIK",
  },
];

export const PROPOSERS = new Set<string>([
  "GDCYHMPLBJCLSVKJWVYYSWDUDHUCAUV7Y2CWFE67XTCW35EG47QM276X",
]);

export function findAllowlistEntry(address: string): AllowlistEntry | null {
  return ALLOWLIST.find((e) => e.address === address) || null;
}

export function isProposer(address: string | null): boolean {
  return !!address && PROPOSERS.has(address);
}

export function isAdmin(address: string | null): boolean {
  return !!address && address === ADMIN_WALLET;
}

/** Matches on-chain `require_reviewer`: admin or authorized proposer. */
export function isReviewer(address: string | null): boolean {
  return isAdmin(address) || isProposer(address);
}
