# KEC Coding Forum Demo Script

Use this path for a principal/faculty review demo.

## 0. Pre-Demo Readiness Gate

Complete this check before opening the application for reviewers:

- Use one professionally named individual event and one professionally named team event.
- Add a poster, at least one incharge, ordered rounds, and exactly one final round to each scenario.
- Add a problem statement with valid reference links where selection is required.
- Prepare registered students and one team that satisfies the minimum team size.
- Keep one event open for registration and one event completed with published results and points.
- Upload at least two post-event images to the completed event.
- Confirm the student can see the open, registered, and completed event views.
- Confirm the assigned faculty sees the event under Needs Attention and can open it.
- Confirm dashboard and analytics totals match the prepared scenario.
- Download one PDF and one Excel report before the live demo to verify the deployment environment.
- Use a database backup or disposable demo records for irreversible publish actions.

## 1. Start System

1. Start PostgreSQL.
2. Start backend:
   ```powershell
   cd server
   .\mvnw.cmd spring-boot:run
   ```
3. Start frontend:
   ```powershell
   cd client
   npm run dev
   ```
4. Open `http://localhost:3000`.

## 2. SuperAdmin Demo

Login:

```text
Email: keccodingforum@kongu.edu
Password: Codingforum@2428
```

Show:

1. Admin dashboard summary cards.
2. Admin analytics page with charts and tables.
3. Events list.
4. Event detail page:
   - poster/flyer
   - setup checklist
   - incharges
   - rounds
   - problem statements
   - registrations
   - post-event media
   - lifecycle-specific actions and read-only terminal state
5. Event incharge management page.
6. Reports page, if report files are required for review.

## 3. Student Demo

Login:

```text
Email: student@kongu.edu
Password: ashu@2007
```

Show:

1. Student dashboard and stats.
2. Event cards with poster and status.
3. Event detail page with incharges, rounds, and problem statements.
4. Individual registration flow.
5. Team creation/join flow for a team event.
6. My registrations and my teams.
7. Results page:
   - before publish: result hidden
   - after publish: result and points visible
8. Leaderboard.
9. Completed event history with published result and points.

## 4. Faculty Demo

Login:

```text
Email: faculty@kongu.edu
Password: bharani@2007
```

Show:

1. Faculty dashboard assigned events.
2. Assigned event detail.
3. Round-wise publish:
   - non-final round disqualification/qualification
   - final round result selection
4. Final publish completes event.
5. Post-event media upload after event completion.
6. Faculty reports and department monitoring if enabled.
7. Show that a published round is locked and cannot be edited again.

## 5. Recommended Demo Data

Prepare at least:

- 5 departments
- 2 faculty accounts
- 4 student accounts across departments
- 1 individual event
- 1 team event
- poster/flyer for both events
- at least one assigned faculty incharge per event
- 2 or more rounds per event
- at least one final round
- active problem statements with reference links
- registrations and a registered team
- final published results
- post-event media images

Do not seed demo data into production by default. Use local/dev database only.
