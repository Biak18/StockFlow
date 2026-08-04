import { ViewStyle } from "react-native";

export const shadows = {
  sm: {
    boxShadow: "0px 1px 3px rgba(15, 23, 42, 0.06)",
  },
  md: {
    boxShadow: "0px 4px 8px rgba(15, 23, 42, 0.08)",
  },
  lg: {
    boxShadow: "0px 8px 16px rgba(15, 23, 42, 0.1)",
  },
} as const satisfies Record<string, ViewStyle>;
// export const shadows = {
//   sm: Platform.select<ViewStyle>({
//     ios: {
//       shadowColor: "#0F172A",
//       shadowOffset: { width: 0, height: 1 },
//       shadowOpacity: 0.06,
//       shadowRadius: 3,
//     },
//     android: { elevation: 2 },
//     default: {},
//   }),
//   md: Platform.select<ViewStyle>({
//     ios: {
//       shadowColor: "#0F172A",
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.08,
//       shadowRadius: 8,
//     },
//     android: { elevation: 4 },
//     default: {},
//   }),
//   lg: Platform.select<ViewStyle>({
//     ios: {
//       shadowColor: "#0F172A",
//       shadowOffset: { width: 0, height: 8 },
//       shadowOpacity: 0.1,
//       shadowRadius: 16,
//     },
//     android: { elevation: 8 },
//     default: {},
//   }),
// } as const;
