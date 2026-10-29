// GET /api/kc/config — public, non-secret: studios (with their footer links) plus which
// settings exist on Netlify (true/false only; never values).
import { LOCATIONS, env, clickupToken, json } from "./_kc.js";

export default async () => {
  return json({
    locations: Object.values(LOCATIONS).map((l) => ({
      id: l.id, name: l.name, short: l.short, page: l.page,
      facebook: l.facebook, instagram: l.instagram, email: l.email, socialOnly: !!l.socialOnly,
    })),
    ready: {
      claude: !!env("ANTHROPIC_API_KEY"),
      clickup: !!clickupToken(),
      passcode: !!env("KC_APP_PASSCODE"),
    },
  });
};

export const config = { path: "/api/kc/config" };
