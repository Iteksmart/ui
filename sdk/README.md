# iTechSmart ProofLink SDKs + `its` CLI

Sprint Tasks 8 & 9. Both SDKs are dependency-free at runtime and tested against
a local mock of the platform API.

## Python — `itechsmart-prooflink` (includes the `its` CLI)

```bash
cd sdk/python
pip install .            # installs the SDK and the `its` command
python3 -m unittest discover -s tests   # 7 tests
```

```python
from itechsmart import ProofLink
pl = ProofLink(api_key="your-key", tenant="your-tenant")
receipt = pl.seal(category="deploy_complete", actor="ci", action="deployed v2.1.0")
print(receipt.id, receipt.verify_url)
print(pl.verify(receipt.id).chain_intact)
```

```bash
its status
its stats
its verify rcpt_abc123
its seal --category deploy_complete --actor ci --action "deployed v2.1.0"
its incidents
its cert
# config: ITS_API_KEY, ITS_TENANT, ITS_API_BASE, ITS_VERIFY_BASE
```

## TypeScript — `@itechsmart/prooflink`

```bash
cd sdk/typescript
npm install && npm test   # builds + 6 tests
```

```ts
import { ProofLink } from "@itechsmart/prooflink"
const pl = new ProofLink({ apiKey: "your-key" })
const receipt = await pl.seal({ category: "deploy", actor: "ci", action: "v2.1.0" })
const result = await pl.verify(receipt.id)
```

## Publishing (server-side step)

PyPI (`itechsmart-prooflink`) and npm (`@itechsmart/prooflink`) publishing
needs registry credentials — wire a GitHub Actions release workflow on tag
push once the repo push access is sorted.
