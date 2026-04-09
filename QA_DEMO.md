# QA Demo Guide

Use the backend demo seed to bootstrap a realistic local payroll environment for manual testing across approvals, attendance, payroll review, loans, notifications, reconciliation, and employee self-service.

## Quick Start

Fastest local setup:

```bash
cd /home/udot/PROJECTS/payroll-backend
./scripts/dev_seed_demo.sh
```

Then start the apps:

```bash
cd /home/udot/PROJECTS/payroll-backend
source venv/bin/activate
PYTHONPATH=. uvicorn app.main:app --reload
```

```bash
cd /home/udot/PROJECTS/payroll-frontend
npm run dev
```

## Seed Command

From `/home/udot/PROJECTS/payroll-backend`:

```bash
source venv/bin/activate
python -m app.db.demo_seed --reset --yes
```

This creates:

- Admin, Admin-Finance, Finance, HR, and Employee demo logins
- 12 employees across fixed, flexible, output-based, shift-based, rotational, compressed, field, and no-time-tracking arrangements
- released, reviewed, and open attendance/payroll cutoffs
- a partial current-cutoff payroll batch in `calculated` state
- approved, pending, and rejected leave/overtime/attendance-correction records
- active, near-completion, completed, and intentionally invalid government loan scenarios
- manual adjustments in applied, approved, and draft states
- exception dashboard, reconciliation, reporting, notifications, and payslip data

## Demo Password

All seeded demo accounts use:

```text
PayrollDemo123!
```

## Demo Accounts By Scenario

- `qa.admin`: Admin role, broad operational dashboard and employee access
- `qa.adminfinance`: Admin-Finance role, payroll owner account for cutoffs, reconciliation, payroll review, settings, and payslip release checks
- `qa.finance`: Finance role, reviewer for reports, exceptions, reconciliation, and notification checks
- `qa.hr`: HR role, employee setup gaps, leave/overtime visibility, and profile alerts
- `qa.manager`: direct manager for pending approval queues
- `qa.lena`: Employee role, released payslip, active near-completion SSS loan, approved overtime, current-cutoff partial payroll record
- `qa.paolo`: active PAG-IBIG loan, approved leave in reviewed cutoff, rejected attendance explanation in open cutoff
- `qa.mia`: output-based employee with rejected sick leave history
- `qa.arvin`: approved reviewed-cutoff attendance correction and pending open-cutoff correction
- `qa.rina`: pending overtime plus intentionally invalid active loan state
- `qa.bea`: pending leave and draft reimbursement adjustment, no released payslip
- `qa.jon`: field-work employee with completed loan history and approved open-cutoff reimbursement applied in the partial payroll batch
- `qa.tess`: no-time-tracking employee with released payroll coverage
- `qa.carla`: incomplete employee setup login for self-service/profile-alert QA
- `qa.noel`: missing payroll policy and incomplete payroll setup login for profile-alert and exception coverage

Minimum role coverage requested for local QA:

- HR: `qa.hr`
- Employee: `qa.lena` or `qa.paolo`
- Admin: `qa.admin`
- Finance: `qa.finance`
- Admin-Finance: `qa.adminfinance`

## Scenario Coverage

- Ready for payroll: `qa.lena` in the open cutoff
- Pending leave approval: `qa.bea`
- Pending overtime approval: `qa.rina`
- Active government loan: `qa.lena`, `qa.paolo`
- Completed loan history: `qa.jon`
- Manual adjustment applied: `qa.lena`, `qa.jon`
- Missing attendance / attendance issues: open cutoff exception set
- Flexible schedule: `qa.paolo`
- Output-based schedule: `qa.mia`
- Locked for cutoff: `qa.lena`, `qa.jon`
- Calculated payroll: open-cutoff partial batch for `qa.lena` and `qa.jon`
- Finalized payroll if supported: released cutoff batch

## Seeded Payroll Timeline

- Released cutoff:
  - finalized and payslip released
  - employee payslips visible
  - loan deductions and applied manual adjustment already reflected
- Reviewed cutoff:
  - finance-ready reconciliation batch
  - approved leave, approved overtime, and approved attendance correction included
- Open cutoff:
  - duplicate attendance import row warning
  - pending leave, pending overtime, pending attendance correction
  - rejected attendance explanation for history coverage
  - two locked employees already calculated into a partial payroll batch

## Suggested QA Pass

1. Log in as `qa.adminfinance`.
2. Check `/dashboard`, `/exceptions`, `/payroll`, `/reports`, `/notifications`, and `/settings`.
3. Open the reviewed payroll batch and compare the reconciliation view against the batch totals.
4. Open the released payroll batch and confirm the released payslip state matches employee self-service.
5. Open the calculated current-cutoff batch and verify only the locked seeded employees are included.
6. Log in as `qa.finance` and review `/reports`, `/exceptions`, `/payroll`, and `/notifications`.
7. Log in as `qa.hr` and review employee setup gaps, pending request visibility, and profile action notifications.
8. Log in as `qa.manager` and verify pending approvals for Bea and Rina.
9. Log in as `qa.lena` and verify visible released payslip, loan nearing completion notification, and no visibility into unreleased current payroll.
10. Log in as `qa.bea`, `qa.rina`, `qa.mia`, `qa.arvin`, `qa.carla`, and `qa.noel` to inspect pending, rejected, and incomplete-profile edge cases.

## Consistency Checks Worth Doing

- Released batch totals should line up with the released cutoff report summary and Lena's released payslip.
- Reviewed batch totals should line up with the reviewed reconciliation summary.
- Exception dashboard should show missing payroll policy, incomplete payroll setup, duplicate salary profiles, invalid loan state, and open payroll/readiness issues.
- Employee payslip pages should only show `payslip_released` rows, never the reviewed or current calculated batch.
- Manager approvals should show pending manager-routed requests only, not finance reporting data.

## Known Gaps And Incomplete Areas

- Frontend `npx tsc --noEmit` still fails because of the pre-existing AG Grid typing issue in `src/components/settings/attendance-cutoff-manager.tsx`.
- Per the current frontend integration status, some dashboard/reporting surfaces are still partly static or only partially wired. Use the seeded API-backed views first: payroll batches, reconciliation, exceptions, notifications, payslips, and employee pages.
- `/settings` is still role-limited in practice. Admin-Finance has the main implemented settings module; HR currently sees a placeholder state.
- No browser automation was added in this QA pass. The seed and smoke tests improve backend workflow confidence plus manual testability.
- The backend employee read endpoints still need separate auth hardening work from the earlier audit.
