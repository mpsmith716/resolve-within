/**
 * Declares the tel:, sms: and https: link intents in the Android manifest <queries>
 * block (package visibility, Android 11+). The app opens these links with
 * Linking.openURL; without <queries>, Linking.canOpenURL reports them as unsupported.
 * Idempotent: an intent already present is not added twice.
 */
const { withAndroidManifest } = require('expo/config-plugins');

const VIEW = 'android.intent.action.VIEW';
const SCHEMES = ['tel', 'sms', 'https'];

function hasViewIntentForScheme(queries, scheme) {
  return queries.some((q) =>
    (q.intent || []).some(
      (intent) =>
        (intent.action || []).some((a) => a.$ && a.$['android:name'] === VIEW) &&
        (intent.data || []).some((d) => d.$ && d.$['android:scheme'] === scheme)
    )
  );
}

function withAndroidLinkQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!Array.isArray(manifest.queries)) manifest.queries = [];
    const missing = SCHEMES.filter((s) => !hasViewIntentForScheme(manifest.queries, s));
    if (missing.length > 0) {
      manifest.queries.push({
        intent: missing.map((scheme) => ({
          action: [{ $: { 'android:name': VIEW } }],
          data: [{ $: { 'android:scheme': scheme } }],
        })),
      });
    }
    return cfg;
  });
}

module.exports = withAndroidLinkQueries;
