"""iTechSmart ProofLink SDK — seal and verify cryptographic audit receipts.

    from itechsmart import ProofLink

    pl = ProofLink(api_key="your-key", tenant="your-tenant")
    receipt = pl.seal(category="deploy_complete", actor="ci", action="deployed v2.1.0")
    result = pl.verify(receipt.id)
"""

from .client import ProofLink, ProofLinkError, Receipt, VerifyResult

__all__ = ["ProofLink", "ProofLinkError", "Receipt", "VerifyResult"]
__version__ = "1.0.0"
