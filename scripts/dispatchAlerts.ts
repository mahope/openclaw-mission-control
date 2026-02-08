import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const execAsync = promisify(exec);

const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL.");

const TARGET = process.env.MC_ALERT_TARGET ?? "6723471511";
const CHANNEL = process.env.MC_ALERT_CHANNEL ?? "telegram";

const client = new ConvexHttpClient(convexUrl);

async function sendTelegram(title: string, body: string) {
  const message = `${title}\n\n${body}`;
  const cmd = `openclaw message send --channel ${CHANNEL} --target ${TARGET} --message "${message.replace(/\"/g, '\\"')}"`;
  await execAsync(cmd, { windowsHide: true });
}

async function run() {
  const alerts = await client.query(api.alerts.listUnsentAlerts, { limit: 10 });
  let sent = 0;

  for (const alert of alerts) {
    try {
      await sendTelegram(alert.title, alert.body);
      await client.mutation(api.alerts.markAlertSent, {
        id: alert._id,
        sentAt: Date.now(),
        sendStatus: "sent",
      });
      sent++;
    } catch (err) {
      await client.mutation(api.alerts.markAlertSent, {
        id: alert._id,
        sentAt: Date.now(),
        sendStatus: "error",
        sendError: String(err),
      });
    }
  }

  if (sent) {
    await client.mutation(api.activity.createActivityEvent, {
      ts: Date.now(),
      source: "mission-control",
      kind: "alerts",
      status: "ok",
      summary: `Alerts dispatched (${sent})`,
      details: { sent },
      relatedPaths: [],
      relatedUrls: [],
      externalId: `alerts-dispatch:${Date.now()}`,
    });
  }

  console.log(`Dispatched ${sent} alerts.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
