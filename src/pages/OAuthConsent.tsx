import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function oauth(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-card">
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-secondary" />
          <span className="font-display text-lg font-bold text-foreground">MedVision</span>
        </div>

        {error && (
          <div>
            <h1 className="mb-2 font-display text-xl font-semibold text-foreground">Authorization error</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {!error && !details && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading authorization…
          </div>
        )}

        {!error && details && (
          <div>
            <h1 className="mb-2 font-display text-xl font-semibold text-foreground">
              Connect {details.client?.name ?? "an app"} to MedVision
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              {details.client?.name ?? "This client"} will be able to call MedVision's enabled tools while you are signed in.
              This does not bypass MedVision's permissions or backend policies.
            </p>
            <div className="mb-6 space-y-2 rounded-lg bg-muted p-4 text-sm">
              <div><span className="text-muted-foreground">Client:</span> <span className="text-foreground">{details.client?.name ?? "Unknown"}</span></div>
              {details.client?.redirect_uri && (
                <div className="break-all"><span className="text-muted-foreground">Redirect:</span> <span className="text-foreground">{details.client.redirect_uri}</span></div>
              )}
              {details.scope && (
                <div><span className="text-muted-foreground">Scope:</span> <span className="text-foreground">{details.scope}</span></div>
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => decide(true)} disabled={busy} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                {busy ? "Working…" : "Approve"}
              </Button>
              <Button onClick={() => decide(false)} disabled={busy} variant="outline" className="flex-1">
                Cancel connection
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
