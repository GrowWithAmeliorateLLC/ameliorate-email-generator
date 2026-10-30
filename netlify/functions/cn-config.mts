// GET /api/cn/config — public, non-secret: centers (with footer details) plus which settings
// exist on Netlify (true/false only; never values).
import { CN_LOCATIONS, env, clickupToken, json } from "./_cn.js";

export default async () => {
  return json({
    locations: Object.values(CN_LOCATIONS).map((l) => ({
      id: l.id, name: l.name, short: l.short, country: l.country, page: l.page, address: l.address,
      phone: l.phone, email: l.email, facebook: l.facebook, instagram: l.instagram,
    })),
    ready: { claude: !!env("ANTHROPIC_API_KEY"), clickup: !!clickupToken(), passcode: !!env("KC_APP_PASSCODE") },
  });
};

export const config = { path: "/api/cn/config" };
