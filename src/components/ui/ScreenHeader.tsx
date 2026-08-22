import { useUIStore } from "@/stores";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({ title, subtitle, right, style }: ScreenHeaderProps) {
  const theme = useUIStore((s) => s.theme);

  return (
    <View style={[styles.header, style]}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
    fontWeight: "500",
  },
  right: {
    marginLeft: 12,
  },
});
