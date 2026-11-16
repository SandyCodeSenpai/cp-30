import { Suspense } from "react";
import { WIDGETS } from "@/widgets/registry";
import type { WidgetId } from "@/widgets/ids";

/** #w-<id>            compact (lesson) mode, 680px wide column
 *  #w-<id>@375        compact mode in a 375px column (phone check)
 *  #w-<id>!full       full lab-page mode, 1100px column
 *  #w-<id>~<b64>      props as base64url JSON (any of the above may come first) */
export default function WidgetHarness({ hash }: { hash: string }) {
  const m = hash.match(/^w-([a-z0-9-]+)(?:@(\d+))?(!full)?(?:~([A-Za-z0-9_-]+))?$/);
  let props: Record<string, unknown> = {};
  if (m?.[4]) { try { props = JSON.parse(atob(m[4].replace(/-/g, "+").replace(/_/g, "/"))); } catch { /* bad props: ignore */ } }
  const meta = m ? WIDGETS[m[1] as WidgetId] : undefined;
  if (!m || !meta) return <div style={{ padding: 24 }}>Unknown widget. Known: {Object.keys(WIDGETS).join(", ")}</div>;
  const full = !!m[3];
  const width = m[2] ? Number(m[2]) : full ? 1100 : 680;
  const C = meta.Component;
  return (
    <div style={{ padding: "24px 16px", display: "flex", justifyContent: "center" }}>
      <div style={{ width, maxWidth: "100%" }} data-harness={meta.id}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>harness · {meta.id} · {full ? "full" : "compact"} · {width}px</div>
        <Suspense fallback={<div>Loading widget</div>}>
          <C {...props} compact={!full} onComplete={() => { document.body.dataset.widgetComplete = "1"; console.log("[harness] onComplete fired"); }} />
        </Suspense>
      </div>
    </div>
  );
}
