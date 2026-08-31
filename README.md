# Enterprise MCP 201 lab guides

Customer-facing lab guides for Enterprise MCP 201: Process MCP Principles.

## Published site

<https://workato-tfo.github.io/enterprise-mcp-201/>

## Contents

| Lab | Time |
|---|---:|
| Observe and diagnose | 30 minutes |
| Redesign the tools | 35 minutes |
| Complete the policy branch and measure | 70 minutes |

The HTML files are self-contained pressed builds. Learner workbook data is stored
locally by the browser; this repository does not collect submissions.

## Visibility contract: designed public

Every commit must meet the public bar: no credentials, internal URLs, employee
names, repository pointers, or authoring discussion. Authoring and review happen
elsewhere.

Only pressed, self-contained HTML belongs in `labs/`. Do not edit HTML in place —
re-press the vetted course bundle and replace the whole snapshot.

Run `bash scripts/publish-checks.sh` before every push. The command verifies both
public-content hygiene and the learner-facing workbook contract in Labs 1 and 3.
Do not change the repository visibility or promote its Pages site without the
course release gate being met.

Enable the tracked local pre-push hook once per clone:

```bash
git config core.hooksPath .githooks
```

The same checks run in GitHub Actions on every push and pull request.

## About the data

Every dataset, company, person, and record in these labs is synthetic.
