# Release Checklist

## Pre-release
- [ ] All feature PRs merged to develop
- [ ] CI pipeline green on develop (lint + typecheck + unit + integration)
- [ ] Staging deployed and smoke-tested
- [ ] Database migration tested on staging
- [ ] No performance regressions (p99 latency stable)
- [ ] Security scan passed (npm audit)
- [ ] API documentation up to date (Swagger)
- [ ] Capability registry current
- [ ] CHANGELOG.md updated

## Release
- [ ] Create release branch `release/vX.Y.Z` from develop
- [ ] Bump version in package.json
- [ ] Final CI run on release branch
- [ ] Merge to main via PR (requires approval)
- [ ] Tag: `git tag vX.Y.Z`
- [ ] Push tag: `git push origin vX.Y.Z`
- [ ] Deploy to production
- [ ] Run database migrations
- [ ] Smoke test production (health, critical paths)
- [ ] Monitor error rates for 30 minutes

## Post-release
- [ ] Merge main back to develop
- [ ] Delete release branch
- [ ] Close related tickets/issues
- [ ] Notify stakeholders (Slack, email)
- [ ] Update ADR index if architectural decisions changed
- [ ] Schedule retrospective if significant release

## Rollback (if needed)
- [ ] Deploy previous tag
- [ ] Revert migration if safe (or apply compensating migration)
- [ ] Notify stakeholders of rollback
- [ ] Create incident ticket
- [ ] Post-mortem within 48 hours
