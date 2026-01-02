import { ThemeConfig } from "antd";

export function getAntdTheme(): ThemeConfig {
  const styles = getComputedStyle(document.documentElement);

  return {
    token: {
      colorPrimary: styles.getPropertyValue("--color-primary").trim(),
      colorSuccess: styles.getPropertyValue("--color-success").trim(),
      colorWarning: styles.getPropertyValue("--color-warning").trim(),
      colorError: styles.getPropertyValue("--color-error").trim(),

      fontFamily: styles.getPropertyValue("--font-sans").trim(),

      fontSize: 14,
      fontSizeSM: 12,
      fontSizeLG: 16,

      padding: 16,
      paddingSM: 8,
      paddingLG: 24,
    },
    components: {
      Layout: {
        headerBg: "#ffffff",
        headerColor: "#1f2937",
        headerHeight: 56,
      },
    },
  };
}
