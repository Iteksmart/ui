# Suite Deployment Runbook — OVH (15.204.107.151)

One container replaces twenty separate frontend containers. The app routes by
Host header (`src/middleware.ts`), so every suite vhost proxies to the same
upstream and each subdomain serves only its own app.

> These steps run ON THE SERVER. They follow the standing rules: temp port
> first, nginx reload only (never restart), receipts sealed only after live
> verification, changes promoted via worktree → promote.sh → main.

## 1. Build

```bash
cd /opt/itechsmart/iTechSmart-Suite/itechsmart-suite   # synced from this repo
docker build -t itechsmart-suite:candidate \
  --build-arg NEXT_PUBLIC_ITS_API_BASE=https://api.itechsmart.dev \
  --build-arg NEXT_PUBLIC_ITS_VERIFY_BASE=https://verify.itechsmart.dev .
```

## 2. Test on a temp port (rule: never go straight to nginx)

```bash
docker run -d --rm --name suite-candidate \
  --network itechsmart-suite_itechsmart-net -p 39300:3300 \
  itechsmart-suite:candidate

# smoke every app through the Host header — all must return 200
for d in verify warroom arbiter impactos generative-workflow architect \
         certification twin market roi knowledge-graph prooflink pulse \
         connect notify workflow rpa forge edge marketplace; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $d.itechsmart.dev" http://127.0.0.1:39300/)
  echo "$d.itechsmart.dev -> $code"
done
```

## 3. Promote the container

```bash
docker stop suite-candidate
docker run -d --name itechsmart-suite --restart unless-stopped \
  --network itechsmart-suite_itechsmart-net itechsmart-suite:candidate
```

## 4. nginx — one vhost per subdomain, reload only

For each of the twenty domains, render `nginx-vhost.conf.template`
(replace `__DOMAIN__`) into the suite nginx conf directory, then:

```bash
docker exec suite-nginx nginx -t          # must pass before reload
docker exec suite-nginx nginx -s reload   # NEVER restart the container
```

Roll out one subdomain at a time in the priority order (verify first). The old
per-app containers keep serving any vhost you haven't switched yet, so this is
zero-downtime and reversible per subdomain (point the vhost back and reload).

## 5. Verify live, then seal — in that order

```bash
# per subdomain: status + content check
curl -s -o /dev/null -w "%{http_code}" https://verify.itechsmart.dev/   # expect 200
curl -s https://verify.itechsmart.dev/ | grep -q "cryptographically sealed" && echo content-ok

# Lighthouse (from any machine):
npx lighthouse https://verify.itechsmart.dev --only-categories=performance,accessibility,best-practices

# ONLY after both checks pass, seal the receipt (internal network):
curl -X POST http://itechsmart-seal:8600/seal \
  -H "Authorization: Bearer $SEAL_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"verify_upgrade_live","note":"verify.itechsmart.dev rebuilt — §10 design system"}'
```

Receipt categories per the master context: `verify_upgrade_live`,
`warroom_upgrade_live`, `arbiter_upgrade_live`, `impactos_upgrade_live`,
`genworkflow_upgrade_live`, `architect_upgrade_live`, and
`{name}_upgrade_live` for the rest.

## 6. Report format

Per frontend: `Component | Done | Verified with (curl status + content) | Receipt ID | Lighthouse score`

## Rollback

Per subdomain: restore the previous vhost file, `nginx -s reload`. Whole
container: `docker stop itechsmart-suite` — old containers still hold their
vhosts until each one was switched.
