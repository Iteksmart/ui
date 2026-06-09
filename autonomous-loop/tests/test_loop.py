"""End-to-end tests for the Autonomous Loop — Sense → Think → Govern → Act → Learn."""

from __future__ import annotations

import unittest

from itsloop import (
    BLOCK,
    REQUIRE_HUMAN,
    CorrelationEngine,
    CyclicalLoop,
    ExecutionResult,
    FeedbackLoop,
    IncidentOutcome,
    InMemoryVectorStore,
    KillSwitchEngaged,
    Plan,
    Policy,
    PolicyEngine,
    SemanticDetector,
    TerraformExecutor,
    TerraformOperationDenied,
    intelligence_report,
    redact,
    route_incident,
)


class SenseTests(unittest.TestCase):
    def setUp(self):
        self.store = InMemoryVectorStore()
        self.store.upsert(
            "INC-2026-0607",
            "suite-apm ERROR OOM killed container memory limit exceeded",
            {"remediation": "restart suite-apm + clear cache", "mttr_minutes": 2.1},
        )
        self.detector = SemanticDetector(self.store)

    def test_known_pattern_returns_past_remediation(self):
        detection = self.detector.analyze("ERROR suite-apm OOM killed — memory limit exceeded again")
        self.assertEqual(detection.kind, "known_pattern")
        self.assertGreaterEqual(detection.similarity, 0.85)
        self.assertEqual(detection.suggested_remediation, "restart suite-apm + clear cache")
        self.assertEqual(detection.matched_id, "INC-2026-0607")

    def test_novel_anomaly_escalates(self):
        detection = self.detector.analyze("CRITICAL quantum flux capacitor desync in warp core")
        self.assertEqual(detection.kind, "novel_anomaly")

    def test_normal_logs_pass(self):
        detection = self.detector.analyze("GET /healthz 200 ok request completed")
        self.assertEqual(detection.kind, "normal")

    def test_redaction_before_embedding(self):
        text = "auth failed for djuane@itechsmart.dev token=sk_live_abc123 Bearer eyJhbGc from 15.204.107.151"
        clean = redact(text)
        self.assertNotIn("djuane@itechsmart.dev", clean)
        self.assertNotIn("sk_live_abc123", clean)
        self.assertNotIn("eyJhbGc", clean)
        self.assertNotIn("15.204.107.151", clean)


class ThinkTests(unittest.TestCase):
    def _loop(self, fail_times: int, **kwargs):
        attempts = {"n": 0}
        seals: list[str] = []
        escalations: list[list] = []

        def planner(ctx):
            # the revised plan must receive the previous failure context
            if ctx.get("previous_failure"):
                return Plan(description=f"revised plan after: {ctx['previous_failure']['failure_reason']}", cycle=0)
            return Plan(description="initial plan", cycle=0)

        def executor(plan):
            attempts["n"] += 1
            if attempts["n"] <= fail_times:
                return ExecutionResult(success=False, detail=f"attempt {attempts['n']} failed")
            return ExecutionResult(success=True)

        loop = CyclicalLoop(
            planner=planner,
            gatekeeper=lambda plan: True,
            executor=executor,
            seal=lambda category, data: seals.append(category),
            escalate=lambda history: escalations.append(history),
            **kwargs,
        )
        return loop, seals, escalations

    def test_fail_twice_succeed_third_cycle(self):
        loop, seals, escalations = self._loop(fail_times=2)
        outcome = loop.run({"incident": "INC-1"})
        self.assertTrue(outcome.resolved)
        self.assertEqual(outcome.cycles_used, 3)
        self.assertEqual(seals, ["incident_cycle_1", "incident_cycle_2", "incident_cycle_3"])
        self.assertEqual(escalations, [])
        self.assertIn("revised plan", outcome.history[1]["plan"])

    def test_max_cycles_escalates_to_human(self):
        loop, _, escalations = self._loop(fail_times=99, max_cycles=3)
        outcome = loop.run({"incident": "INC-2"})
        self.assertFalse(outcome.resolved)
        self.assertTrue(outcome.escalated)
        self.assertEqual(len(escalations), 1)

    def test_kill_switch_blocks_everything(self):
        loop, _, _ = self._loop(fail_times=0, kill_switch=lambda: True)
        with self.assertRaises(KillSwitchEngaged):
            loop.run({"incident": "INC-3"})

    def test_dry_run_never_executes(self):
        executed = {"n": 0}
        loop = CyclicalLoop(
            planner=lambda ctx: Plan("plan", 0),
            gatekeeper=lambda plan: True,
            executor=lambda plan: executed.update(n=executed["n"] + 1) or ExecutionResult(True),
            dry_run=True,
        )
        outcome = loop.run({})
        self.assertFalse(outcome.resolved)
        self.assertEqual(executed["n"], 0)

    def test_specialist_routing(self):
        self.assertEqual(route_incident("postgres slow query on core_db")["agent"], "DatabaseAgent")
        self.assertEqual(route_incident("wazuh CVE intrusion attempt")["agent"], "SecurityAgent")
        self.assertEqual(route_incident("dns timeout and tls certificate expiring")["agent"], "NetworkAgent")
        self.assertEqual(route_incident("hipaa audit gap in retention")["model"], "claude")
        self.assertEqual(route_incident("something nondescript happened")["agent"], "GeneralistAgent")


class GovernTests(unittest.TestCase):
    def setUp(self):
        self.engine = PolicyEngine()

    def test_db_change_in_business_hours_needs_human(self):
        decision = self.engine.decide(
            {"action": {"type": "database", "target": {"env": "production", "hipaa_scope": False, "name": "core_db"}},
             "time": {"hour": 14}, "daily_count": 0}
        )
        self.assertEqual(decision.action, REQUIRE_HUMAN)

    def test_fourth_production_restart_blocked(self):
        decision = self.engine.decide(
            {"action": {"type": "restart", "target": {"env": "production", "hipaa_scope": False, "name": "suite-octoai"}},
             "time": {"hour": 3}, "daily_count": 4}
        )
        self.assertEqual(decision.action, BLOCK)

    def test_low_risk_off_hours_allowed(self):
        decision = self.engine.decide(
            {"action": {"type": "restart", "target": {"env": "production", "hipaa_scope": False, "name": "suite-octoai"}},
             "time": {"hour": 3}, "daily_count": 1}
        )
        self.assertTrue(decision.allowed)

    def test_protected_service_always_blocked(self):
        decision = self.engine.decide(
            {"action": {"type": "restart", "target": {"env": "production", "hipaa_scope": False, "name": "suite-postgres"}},
             "time": {"hour": 3}, "daily_count": 0}
        )
        self.assertEqual(decision.action, BLOCK)

    def test_tenant_policy_tightens_only_for_that_tenant(self):
        self.engine.add(Policy(
            name="Hospital: no auto-restarts at all",
            condition="action.type == 'restart'",
            action=REQUIRE_HUMAN,
            tenant="halcyon",
        ))
        ctx = {"action": {"type": "restart", "target": {"env": "staging", "hipaa_scope": False, "name": "x"}},
               "time": {"hour": 3}, "daily_count": 0}
        self.assertEqual(self.engine.decide(ctx, tenant="halcyon").action, REQUIRE_HUMAN)
        self.assertTrue(self.engine.decide(ctx, tenant="westgate").allowed)

    def test_unevaluable_policy_fails_closed(self):
        self.engine.add(Policy(name="bad", condition="__import__('os').system('x')", action=BLOCK))
        decision = self.engine.decide(
            {"action": {"type": "noop", "target": {"env": "dev", "hipaa_scope": False, "name": "x"}},
             "time": {"hour": 3}, "daily_count": 0}
        )
        self.assertEqual(decision.action, REQUIRE_HUMAN)
        self.assertTrue(decision.errors)


class ActTests(unittest.TestCase):
    def test_whitelisted_operation_builds_targeted_commands(self):
        run = TerraformExecutor().execute("scale_replicas", {"service": "suite-octoai", "replicas": 3})
        self.assertIn("-target=module.containers", run.commands[0])
        self.assertFalse(run.applied)  # dry-run default

    def test_destroy_is_structurally_impossible(self):
        executor = TerraformExecutor()
        with self.assertRaises(TerraformOperationDenied):
            executor.execute("destroy_everything", {})
        with self.assertRaises(TerraformOperationDenied):
            executor.execute("scale_replicas", {"service": "x; terraform destroy", "replicas": 1})

    def test_real_apply_seals_pre_and_post(self):
        seals = []
        executor = TerraformExecutor(
            seal=lambda category, data: seals.append(category) or f"rcpt_{category}",
            runner=lambda cmd: 0,
            dry_run=False,
        )
        run = executor.execute("r2_bucket_create", {"bucket": "compliance-evidence"})
        self.assertTrue(run.applied)
        self.assertEqual(seals, ["terraform_pre_plan", "terraform_post_verify"])


class LearnTests(unittest.TestCase):
    def test_third_incident_resolves_with_prior_context(self):
        """Spec acceptance: run 3 incidents, the 3rd starts with the known fix."""
        loop = FeedbackLoop()
        # incident 1 — novel, no suggestion exists yet
        self.assertIsNone(loop.suggest("suite-n8n webhook delivery failures ERROR timeout"))
        loop.record(IncidentOutcome(
            incident_id="INC-1", pattern_text="suite-n8n webhook delivery failures ERROR timeout",
            remediation="restart suite-n8n + replay queue", classification="success", mttr_minutes=4.8,
        ))
        # incident 2 — same pattern, suggestion now available
        s2 = loop.suggest("ERROR webhook delivery failures timeout on suite-n8n")
        self.assertIsNotNone(s2)
        loop.record(IncidentOutcome(
            incident_id="INC-2", pattern_text="suite-n8n webhook delivery failures ERROR timeout",
            remediation="restart suite-n8n + replay queue", classification="success", mttr_minutes=1.2,
        ))
        # incident 3 — fix is in context before planning starts
        s3 = loop.suggest("suite-n8n ERROR timeout webhook delivery failures")
        self.assertEqual(s3.remediation, "restart suite-n8n + replay queue")
        self.assertLess(s3.expected_mttr_minutes, 4.8)

    def test_failed_remediation_becomes_negative_example(self):
        loop = FeedbackLoop()
        loop.record(IncidentOutcome(
            incident_id="INC-BAD", pattern_text="suite-redis ERROR maxmemory evictions",
            remediation="increase maxmemory blindly", classification="failure", mttr_minutes=22.0,
        ))
        loop.record(IncidentOutcome(
            incident_id="INC-GOOD", pattern_text="suite-redis ERROR maxmemory evictions",
            remediation="clear gtm:* cache namespace", classification="success", mttr_minutes=1.5,
        ))
        suggestion = loop.suggest("ERROR suite-redis maxmemory evictions rising")
        self.assertEqual(suggestion.remediation, "clear gtm:* cache namespace")
        self.assertIn("increase maxmemory blindly", suggestion.avoid)

    def test_three_similar_incidents_flag_systemic(self):
        outcomes = [
            IncidentOutcome(f"INC-{i}", "tls certificate expiring on edge tunnel", "renew cert", "success", 2.0, tenant=t)
            for i, t in enumerate(["halcyon", "westgate", "parkside"])
        ] + [IncidentOutcome("INC-X", "postgres deadlock on pilot_bookings", "kill blocking query", "success", 3.0, tenant="halcyon")]
        clusters = CorrelationEngine().correlate(outcomes)
        systemic = [c for c in clusters if c.systemic]
        self.assertEqual(len(systemic), 1)
        self.assertEqual(len(systemic[0].incident_ids), 3)
        self.assertEqual(systemic[0].tenants, ["halcyon", "parkside", "westgate"])

    def test_intelligence_report_shows_improvement(self):
        last = [IncidentOutcome(f"L{i}", "pattern A failure mode", "fix", "success", 4.0) for i in range(3)]
        now = [IncidentOutcome(f"N{i}", "pattern A failure mode", "fix", "success", 2.0) for i in range(3)]
        now.append(IncidentOutcome("N9", "never seen before pattern Z", "fix", "failure", 8.0))
        report = intelligence_report(now, last, CorrelationEngine().correlate(now))
        self.assertIn("getting smarter", report)
        self.assertIn("never seen before pattern Z", report)
        self.assertIn("Top incident patterns", report)


class FullLoopTest(unittest.TestCase):
    def test_sense_think_govern_act_learn_roundtrip(self):
        """One incident through all five layers, then the same pattern again — faster."""
        memory = FeedbackLoop()
        engine = PolicyEngine()
        seals: list[str] = []

        log_window = "ERROR suite-octoai health check failing connection refused"

        # SENSE — novel the first time
        detector = SemanticDetector(memory.store)
        self.assertEqual(detector.analyze(log_window).kind, "novel_anomaly")

        # THINK + GOVERN + ACT — cyclical loop with the policy engine as gate
        def gatekeeper(plan: Plan) -> bool:
            ctx = {"action": {"type": "restart", "target": {"env": "production", "hipaa_scope": False, "name": "suite-octoai"}},
                   "time": {"hour": 3}, "daily_count": 1}
            return engine.decide(ctx).allowed

        outcome = CyclicalLoop(
            planner=lambda ctx: Plan("restart suite-octoai", 0),
            gatekeeper=gatekeeper,
            executor=lambda plan: ExecutionResult(success=True),
            seal=lambda category, data: seals.append(category),
        ).run({"incident": "INC-LOOP"})
        self.assertTrue(outcome.resolved)

        # LEARN — record the outcome
        memory.record(IncidentOutcome(
            incident_id="INC-LOOP", pattern_text=log_window,
            remediation="restart suite-octoai", classification="success", mttr_minutes=2.07,
            receipt_ids=["rcpt_demo"],
        ))

        # SENSE again — now it is a known pattern with the fix pre-loaded
        detection = detector.analyze("suite-octoai connection refused ERROR health check failing")
        self.assertEqual(detection.kind, "known_pattern")
        self.assertEqual(detection.suggested_remediation, "restart suite-octoai")
        self.assertEqual(seals, ["incident_cycle_1"])


if __name__ == "__main__":
    unittest.main()
