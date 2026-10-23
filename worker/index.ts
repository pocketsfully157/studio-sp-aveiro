import handler from "vinext/server/fetch-handler";
import { sendDueReminders } from "../lib/server/reminders";

const worker = {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    return handler.fetch(request, env, ctx);
  },
  // Cron definido em wrangler.jsonc › triggers.
  scheduled(_controller: ScheduledController, _env: Cloudflare.Env, ctx: ExecutionContext) {
    ctx.waitUntil(sendDueReminders().then(n => console.log(`Lembretes enviados: ${n}`)));
  },
} satisfies ExportedHandler<Cloudflare.Env>;

export default worker;
