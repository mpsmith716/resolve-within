# Device Smoke Checklist (Owner)

Run on physical device or emulator after signing/OAuth are configured. Mark ANDROID / IOS independently.

| Area | ANDROID | IOS | Notes |
|------|---------|-----|-------|
| Cold launch / splash | | | |
| Auth — email sign-in | | | |
| Auth — Google | | | Requires updated OAuth package/bundle |
| Auth — Apple | | | iOS only; requires Apple config |
| Onboarding | | | |
| Home / daily message | | | |
| Journal create/list/delete | | | |
| Breathing / grounding | | | Optional audio if enabled |
| Veterans favorites | | | |
| Community read/post/report | | | |
| Admin (admin account only) | | | |
| Crisis / 988 affordance | | | Must open dialer/SMS or show number; no fake dispatch |
| Notifications permission prompt | | | Optional enable/disable |
| Delete My Data | | | Must fail closed; success then logout |
| Privacy / Terms / Guidelines screens | | | |
| Deep link `resolvewithin://` | | | |
| Offline / backend error UX | | | No crash |

Do not run destructive tests against production user data you cannot restore.
