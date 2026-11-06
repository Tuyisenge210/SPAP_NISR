export const SPAP_ENV_MODE =
  String(import.meta.env.VITE_SPAP_MODE ?? (import.meta.env.DEV ? "development" : "production")).toLowerCase();

export const IS_DEVELOPMENT_MODE =
  import.meta.env.DEV ||
  SPAP_ENV_MODE === "development" ||
  import.meta.env.VITE_SPAP_DEVELOPMENT_MODE === "true";

export const SPAP_ENV_BADGE = IS_DEVELOPMENT_MODE ? "CALIBRATION" : "PRODUCTION";
