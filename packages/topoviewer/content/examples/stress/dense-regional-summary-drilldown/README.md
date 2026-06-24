# Dense Regional Summary Drill-Down Stress Fixture

This fixture preserves the large 3-region topology used to review aggregate
summary drill-down at scale. Each region contains 100 nodes: 10 rings with 8
edge nodes and 2 aggregation nodes per ring. The first four aggregation nodes
in every region act as PE routers, and every region pair has a 4-by-4
inter-region PE full mesh.

The public `attention/dense-summary-drilldown` example is intentionally smaller
and hand-authored so the documentation teaches the operator workflow. Use this
fixture for performance checks, manual stress review, and validating that
aggregate summaries and counted links still behave on larger topologies.
