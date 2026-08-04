import NetInfo from "@react-native-community/netinfo";

let online = true;

// Keep a module-level flag updated by the hook
export function setNetworkOnline(value: boolean) {
  online = value;
}

export function getNetworkOnline() {
  return online;
}

/** One-shot check (useful before a write) */
export async function checkNetworkOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  const value = !!(state.isConnected && state.isInternetReachable !== false);
  online = value;
  return value;
}
