import { setNetworkOnline } from "@/services/network";
import { useUIStore } from "@/stores";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetworkStatus() {
  const setOnline = useUIStore((s) => s.setOnline);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!(
        state.isConnected && state.isInternetReachable !== false
      );
      setIsOnline(online);
      setOnline(online);
      setNetworkOnline(online);
    });

    return unsubscribe;
  }, [setOnline]);

  return isOnline;
}
