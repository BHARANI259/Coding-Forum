# KEC Coding Forum — End User Review Report

Review basis: live walkthrough of the current local application as Student, Faculty Incharge, and SuperAdmin using the available development accounts and seeded data. The review covered navigation, readable page states, role visibility, responsive layouts, and the main non-destructive workflows. Destructive actions, actual report downloads, and data-changing submissions were not executed during this evaluation.

## 1. Overall Summary

The application has broad and useful coverage of a real college coding-forum workflow. It combines event publishing, individual and team registration, problem statements, round progression, results, points, leaderboards, analytics, reports, notifications, and post-event evidence in one portal. This is meaningfully better than coordinating the same work through separate WhatsApp messages, Google Forms, spreadsheets, and manually assembled reports.

The product is close to being a convincing college portal, but it is not yet ready for an unscripted principal demonstration or unrestricted real use. The largest weakness is lifecycle trust. In the reviewed data, cancelled events still expose round-result publishing and result-management actions, while analytics show points and published results for events whose visible status is cancelled. A user cannot confidently tell which state is authoritative.

It is suitable for a controlled internal demo after the critical state issues and demo data are cleaned up. Real deployment should wait until event-state permissions, final-round readiness, denied-page behavior, and the core role journeys have been tested with fresh end-to-end data.

Biggest strengths:

- Strong role separation and a consistent academic portal shell.
- Good coverage of individual events, team events, problem statements, rounds, results, points, reports, and evidence uploads.
- Student event cards, the admin round builder, analytics, and report choices are presentation-friendly.
- Event incharge assignment and faculty-only event access reduce manual coordination.
- Mobile layouts stack cleanly on the pages reviewed, with a usable menu and touch-sized controls.

Biggest weaknesses:

- **[CRITICAL]** Cancelled events still present enabled result-management and per-round publish actions.
- **[CRITICAL]** Current demo data is internally contradictory: zero published/completed events are shown while results, points, and published-result indicators exist.
- **[HIGH]** Some access failures show a denial message while loading text or usable controls remain on the page.
- **[HIGH]** An event can appear structurally ready with rounds configured even when no round is marked final.
- **[HIGH]** Student and faculty dashboards show totals but do not consistently turn those totals into clear next actions.

## 2. Scores

- Student experience: **7.0/10**
- Faculty experience: **6.3/10**
- Admin experience: **7.4/10**
- UI/UX design: **7.3/10**
- Ease of use: **6.8/10**
- College-readiness: **6.5/10**
- Principal-demo readiness: **6.0/10**

## 3. Student Review

### What works well

- Login is easy to locate and clearly separated by role. The form is compact and the role badge reduces the chance of signing in through the wrong portal.
- The sidebar labels are student-friendly: Events, My Registrations, My Teams, Leaderboard, Results, Notifications, and Profile.
- The dashboard gives real personal statistics, including total points, events participated, wins, runner-ups, participation count, and recent point history.
- Team information is useful after creation. The team code, members, leader, selected problem statement, and registration state are visible together.
- Unpublished final results are hidden and the Results page gives a direct “Result not published yet” state.
- Leaderboards provide college, department, best-coder, and engagement views, which makes participation feel meaningful.
- Notifications are easy to scan and the mobile notification layout is especially clean.
- Profile editing, contact information, automatic year display, technical area, placement willingness, and password change are all available in one place.

### What is confusing

- **[HIGH]** Opening an ineligible event directly can show both “Access denied” and “Loading event...” at the same time. A student needs one final state, a short reason, and a button back to Events.
- **[HIGH]** The Events empty state says only “No eligible events found.” It does not tell the student whether there are no current events, all events are restricted, or completed events are in another view.
- **[HIGH]** The dashboard does not immediately answer “What can I register for now?” or show leaderboard rank, active team state, and unread notifications as actionable links.
- **[MEDIUM]** “My Registrations” uses internal wording such as “Auto-approved registrations.” Students mainly need “Registered” and confirmation details; the approval implementation is not useful wording for them.
- **[MEDIUM]** Team readiness is not prominent enough. Current member count and minimum required members should sit directly beside the Enroll Team action.
- **[MEDIUM]** The Results empty/unpublished message is presented inside a table without clearly naming the related event.
- **[MEDIUM]** The department leaderboard includes many zero-point departments, making the meaningful rankings harder to scan.
- **[LOW]** Notification types are displayed in system-style uppercase wording such as “ROUND UPDATED.” Friendlier labels would feel less technical.

### Missing or weak areas

- **[HIGH]** There is no clear single student “next action” area for registration closing soon, team incomplete, round result available, or final result published.
- **[HIGH]** The current seed data did not provide an eligible open event, so the full registration journey is not demonstrable from the student account without preparing better demo data.
- **[MEDIUM]** Round progress should use a simple journey such as “Qualified for Round 2,” “Waiting for Round 2,” or “Disqualified in Prelims,” rather than expecting students to interpret raw round statuses.
- **[MEDIUM]** Profile is too long because personal information, password change, statistics, and point history are combined on one continuous page.

### Recommended changes

- **[CRITICAL]** Prepare at least one open individual event and one open team event for the student demo account, with valid eligibility and problem statements.
- **[HIGH]** Replace the generic events empty state with an explanation and tabs or filters for Open, Registered, Completed, and Not Eligible.
- **[HIGH]** Add a compact “Your next actions” section to the dashboard with direct links to an open event, incomplete team, latest round result, and unread notifications.
- **[HIGH]** On team registration, show “2 of 3 minimum members joined” immediately above the Enroll Team button.
- **[MEDIUM]** Show event title and publication state on every result row instead of one generic unpublished message.
- **[MEDIUM]** Add a short “How points work” explanation near the leaderboard and hide zero-point departments by default.
- **[LOW]** Split Profile into Personal Info, Security, and Statistics tabs or sections with a compact summary.

## 4. Faculty Review

### What works well

- The dashboard now shows assigned-event and result counts plus a recent assigned-events table, so faculty can see that assignments are connected correctly.
- Assigned events, co-incharges, event restrictions, registrations, teams, problem statements, rounds, reports, and post-event media are available from the event context.
- Round-wise publishing is much clearer than a single global result button. Non-final rounds use disqualification controls and final rounds use final-result choices.
- Published-state badges and timestamps provide an audit trail.
- Post-event media is correctly explained as unavailable until event completion, which matches the reporting workflow.
- Faculty report downloads are grouped by event and department, reducing dependence on manually maintained Excel files.
- Profile editing, contact details, password change, department-monitoring status, and assignment history are available.

### What is confusing

- **[CRITICAL]** A cancelled event still shows enabled “Publish Round Result” buttons and result-management controls. Faculty could reasonably believe publishing is allowed.
- **[HIGH]** The event detail subtitle calls the page read-only while the same page contains editable round-status selectors and publish actions.
- **[HIGH]** The result-entry page says “Declare final results” even when the selected rounds are non-final shortlist rounds.
- **[HIGH]** The Reports page can show “Access denied” while report controls remain visible and some department buttons still appear usable. Permission failure should replace the restricted section, not coexist with it.
- **[HIGH]** Manual round-status dropdowns expose all lifecycle states. Faculty can potentially choose COMPLETED or CANCELLED without following Start Round and Publish Round Result in sequence.
- **[MEDIUM]** The dashboard counts assigned events but does not show which event needs an action now.
- **[MEDIUM]** Repeated “Round updated” notifications are noisy and can hide important result-published or registration-closed notices.

### Missing or weak areas

- **[HIGH]** There is no task-focused queue such as “Round ready to start,” “Results not published,” “Registration closes today,” or “Upload post-event proof.”
- **[HIGH]** The UI does not consistently explain why an action is disabled or why a faculty member lacks access.
- **[MEDIUM]** Participant and team tables are information-rich but could be difficult to operate during a live event on a phone or smaller laptop.
- **[MEDIUM]** Faculty profile repeats a large amount of assigned-event information already available on Dashboard and Assigned Events.

### Recommended changes

- **[CRITICAL]** Enforce a single event-state action matrix: cancelled and completed events must be read-only; non-final published rounds must lock; final publication must lock the event.
- **[HIGH]** Replace free manual status changes with contextual actions: Start Round, Publish Round Result, and Publish Final Result. Keep manual status override admin-only if it is truly required.
- **[HIGH]** Rename page text according to the selected round: “Shortlist participants” for non-final rounds and “Declare final positions” for the final round.
- **[HIGH]** Make denied pages display only a permission message, the reason, and a Back button.
- **[MEDIUM]** Add a faculty dashboard “Needs attention” list sorted by urgency.
- **[MEDIUM]** Group repetitive round-update notifications or send them only when status/result publication changes.
- **[LOW]** Keep personal information and password change in Profile, but move assignment history back to Assigned Events.

Training still needed after these fixes: a short five-minute explanation of round progression, the difference between saving a draft and publishing, and the irreversible lock after publication. The rest of the faculty workflow is discoverable.

## 5. Admin Review

### What works well

- The dashboard gives a useful executive overview of students, faculty, events, registrations, teams, results, and awarded points.
- Student and faculty management support both individual creation and batch import, with filters and visible account linkage.
- Event incharge management is strong. Multiple faculty, primary incharge, responsibility text, filtering, editing, and removal are all clearly represented.
- Event detail is comprehensive: summary, setup checklist, poster, incharges, reports, problem statements, rounds, registrations, media, and results are connected in one place.
- Problem statements support multiple labeled links and active/inactive states, which is suitable for hackathons and project events.
- The modern round builder is one of the strongest screens. The timeline, final-round badge, publication state, and per-round actions communicate event structure well.
- Analytics cover participation, points, categories, registration trends, result distribution, technical areas, event status, students, departments, and engagement.
- Reports are logically grouped into Event, Department, Leaderboard, and Yearly exports. The academic-year format and April usage note are clear.

### What is confusing

- **[CRITICAL]** Admin dashboard data is not credible in its current seeded state: it reports zero published and completed events while results, points, and published-result indicators exist elsewhere.
- **[CRITICAL]** Cancelled event detail pages still allow Manage Results, media upload, problem-statement creation, round creation, and round-result publication.
- **[HIGH]** The Events table still shows a Cancel button for events already marked CANCELLED.
- **[HIGH]** Event creation is a very long single form containing basic details, poster, problem statements, dates, team capacity, restrictions, and incharges. An occasional user is likely to miss a field or create contradictory settings.
- **[HIGH]** Event status and Registration Open are independently editable, which invites combinations such as completed/cancelled with registration open unless the backend always corrects it.
- **[HIGH]** The setup checklist counts “Rounds configured” as complete even when none of the rounds is final. This can give a false sense of readiness.
- **[MEDIUM]** Allowed Sections is a comma-separated text field, so spaces, case, and spelling can create silent eligibility mistakes.
- **[MEDIUM]** Student creation still presents a manual Year field while the student profile describes year as automatically calculated.
- **[MEDIUM]** The event detail page is extremely long. Important setup actions and post-event actions compete on the same screen.
- **[LOW]** Setup checklist markers use plain “Y” and “!” characters. They look unfinished and are less accessible than labeled status icons.

### Missing or weak areas

- **[HIGH]** There is no hard readiness rule or prominent warning for “exactly one final round,” assigned incharge, valid registration window, and compatible event status before publishing an event.
- **[HIGH]** Demo data is dominated by smoke-test names and cancelled events, which is unsuitable for a principal or placement-coordinator presentation.
- **[MEDIUM]** Analytics are useful but long. An administrator has to scroll through many charts before reaching the top-student and top-department summaries.
- **[MEDIUM]** The import onboarding does not visibly offer a downloadable template from the inspected screen.
- **[MEDIUM]** Report buttons use implementation-oriented labels such as “Student List Excel.” A more task-oriented label such as “Download Participant List” would be easier for non-technical staff.

### Recommended changes

- **[CRITICAL]** Clean and rebuild demo data around one published registration event, one ongoing multi-round event, and one completed event with results, media, reports, points, and notifications.
- **[CRITICAL]** Apply lifecycle locking consistently across every admin and faculty action, not just registration controls.
- **[HIGH]** Require exactly one final round before an event can be marked ready for final-result workflow.
- **[HIGH]** Convert event creation into clear steps or collapsible sections: Details, Schedule, Eligibility, Team Rules, Incharges, and Review. Problem statements and rounds can remain post-create management.
- **[HIGH]** Derive registration availability from status and dates where possible, or show an immediate warning when the values conflict.
- **[MEDIUM]** Replace comma-separated sections with selectable chips or validated options.
- **[MEDIUM]** Use the same automatic year calculation in admin student creation/import preview and student profile.
- **[MEDIUM]** Add a downloadable student/faculty import template and a preview showing valid and invalid rows before import.
- **[LOW]** Collapse secondary analytics under “More analytics” and keep participation, points, status, top students, and top departments most prominent.

## 6. UI/UX Review

### Visual design feedback

- The navy sidebar, white surfaces, grey background, and purple accent look appropriate for an academic operations portal.
- Cards and badges are generally consistent, and the event poster areas avoid broken-image states.
- **[HIGH]** Lifecycle contradictions damage visual trust more than styling does. A CANCELLED badge beside enabled purple publish buttons makes the interface feel unsafe.
- **[MEDIUM]** Dense pages mix compact legacy tables with more spacious modern round cards, so typography and control density can feel inconsistent.
- **[LOW]** Replace textual checklist symbols with accessible icon-and-text states such as Complete, Missing, and Not required.

### Navigation feedback

- Role-specific sidebars are clear and active states are visible.
- Back buttons are present on the major detail pages reviewed.
- Mobile replaces the sidebar with a Menu button and preserves access to the page title and notification bell.
- **[MEDIUM]** Admin navigation is long. Grouping Users, Event Setup, Performance, and Communication would reduce scanning time without removing pages.
- **[MEDIUM]** Profile pages duplicate dashboard/history content and increase perceived navigation depth.

### Form feedback

- Inputs and buttons have usable sizes, labels, disabled states, and mobile stacking.
- **[HIGH]** The event form needs progressive disclosure and a final review step because too many independent settings can conflict.
- **[MEDIUM]** Required fields are not always visually distinguishable before submission.
- **[MEDIUM]** Validation should appear beside the field and explain the remedy, especially for schedules, team sizes, links, and eligibility.
- **[LOW]** Destructive actions should consistently use confirmation text that names the event, assignment, problem statement, or media item.

### Table/card feedback

- Event cards are more appropriate than tables for student discovery.
- Tables remain suitable for admin operations and reports, but long names and many columns need independent scrolling or responsive row summaries.
- **[MEDIUM]** Leaderboard zero rows and long department names reduce scan speed.
- **[MEDIUM]** Faculty registrations/results would benefit from a sticky participant identity column during live event operation.
- **[LOW]** Limit dashboard preview tables to the most meaningful rows and link to the full page.

### Mobile feedback

- The reviewed notification, student-management, and event-detail pages stack correctly at a phone-sized viewport. Controls remain reachable and the menu pattern is clear.
- **[MEDIUM]** Long management forms remain operational but require excessive scrolling; section navigation or collapsible groups would help.
- **[MEDIUM]** Wide operational tables need deliberate card-row alternatives or clear horizontal-scroll cues.
- **[LOW]** Test the live round-result workflow on an actual phone before deployment because rapid switch/dropdown operation is more demanding than static page responsiveness.

### Wording feedback

- Most headings are concise and role-appropriate.
- **[HIGH]** “Read-only event view” conflicts with editable faculty controls.
- **[HIGH]** “Declare final results” is incorrect on non-final rounds.
- **[MEDIUM]** “Auto-approved registrations” exposes implementation language instead of confirming the student's state.
- **[MEDIUM]** Raw status values such as NOT_STARTED and RUNNER_UP should be presented as “Not started” and “Runner-up” in user-facing text.
- **[LOW]** Report actions should say what the user receives: “Download Event Report (PDF)” and “Download Participant List (Excel).”

## 7. Feature Completeness Table

| Feature | Student | Faculty | Admin | Status | Feedback |
|---|---|---|---|---|---|
| Authentication | Clear role login and logout | Clear role login and logout | Clear role login and logout | Needs Polish | Login works; add consistently human-friendly invalid-session and wrong-role messages. |
| Role-based dashboards | Personal statistics | Assignment and department totals | Executive totals and previews | Needs Polish | Data is useful, but student/faculty dashboards need actionable next steps. |
| Student management | Profile self-edit | View through monitoring/event data | Create, import, filter, list | Needs Polish | Strong coverage; manual year input conflicts with automatic year logic. |
| Faculty management | Incharge details visible | Profile self-edit | Create, import, filter, list | Complete | Suitable for core administration, with onboarding wording still improvable. |
| Event creation | Not applicable | Read assigned events | Full creation and restrictions | Needs Polish | Complete but too long and permits confusing status/registration combinations. |
| Event poster/flyer | Visible with placeholder | Read-only preview | Upload, replace, remove | Complete | Clear promotional-media separation and reliable fallback. |
| Event cards | Browse and open events | Assigned-event presentation | Controls underlying data | Partially Complete | Card design is strong; current student account has no eligible event to demonstrate it. |
| Event incharges | Names/contact visible | Assigned and co-incharge context | Multi-assign, primary, responsibility | Complete | One of the strongest modules. |
| Problem statements | Active statements and selection | Assigned-event read-only view | Create, edit, status, delete | Complete | Admin controls are now visible and integrated. |
| Multiple reference links | Open labeled links | View labeled links | Dynamic add/edit links | Complete | Useful and understandable when labels are provided. |
| Individual registration | Supported with required selection | Participant visible | Registration visible | Partially Complete | Logic appears present; no eligible live event was available for full walkthrough. |
| Team creation | Create team | Team/registration visibility | Team visibility | Needs Polish | Flow exists, but readiness and next-step guidance should be more prominent. |
| Team joining | Join by code | Team member visibility | Team visibility | Needs Polish | Functional concept; error and successful-join guidance need live validation. |
| Team enrollment | Leader enrolls after minimum size | Registered team visible | Registration visible | Needs Polish | Show current count versus minimum directly beside the action. |
| Round flow | Published progress only | Operates assigned rounds | Defines and reviews rounds | Confusing | Good visual builder, but manual status changes and cancelled-event actions weaken clarity. |
| Round-wise publish | Sees published outcome | Per-round publish action | Per-round oversight | Partially Complete | Correct direction; state gating is not trustworthy in cancelled events. |
| Final result publish | Sees result after publish | Final-result workflow | Oversight and result management | Partially Complete | Requires a guaranteed final round and consistent final lock. |
| Result lock after publish | Read-only result | Should become read-only | Oversight | Partially Complete | Published-state messaging exists, but lifecycle controls remain enabled in conflicting states. |
| Student results | Published result protected | Result entry context | Result visibility | Needs Polish | Privacy behavior is good; event-specific status presentation is weak. |
| Points | Personal history and totals | Department totals | Aggregate totals | Complete | Real point data is visible and understandable at summary level. |
| Leaderboard | Multiple leaderboard types | General visibility | Full leaderboard | Needs Polish | Broad coverage; explain scoring and hide unhelpful zero rows by default. |
| Admin analytics | Not available | Not available | Charts, filters, top lists | Complete | Valuable and presentation-ready after demo data/status consistency is fixed. |
| Reports | No exports | Assigned event/department exports | Event, department, leaderboard, yearly exports | Partially Complete | UI coverage is strong; actual downloaded files were not opened in this review. |
| Notifications | Bell, filters, full list | Bell, filters, full list | Bell, filters, full list | Needs Polish | Useful delivery surface; repetitive round notifications create noise. |
| Post-event media upload | Not exposed | Upload after completion | Full management | Partially Complete | Rules and UI are clear; state enforcement must be verified against cancelled events. |
| Security/permissions from user perspective | Role routes isolated | Assignment-based access | Admin-only management | Partially Complete | Core separation is visible, but denial states sometimes coexist with controls/loading. |
| Mobile usability | Menu and stacked content | Responsive shell | Forms and details stack | Needs Polish | Generally adaptive; long forms and wide operational tables remain cumbersome. |

## 8. Must Fix Before Demo

1. **[CRITICAL] Lock cancelled and completed events consistently.** Remove or disable result entry, round publishing, new rounds, registration changes, and other lifecycle mutations that should no longer be allowed.
2. **[CRITICAL] Replace smoke-test demo data.** Present one coherent published event, one ongoing event, and one completed event. Dashboard, analytics, reports, points, and visible event statuses must agree.
3. **[HIGH] Fix denied-page rendering.** Never show Access denied together with loading text or active restricted controls. Show the reason and one safe navigation action.
4. **[HIGH] Require exactly one final round before final-result readiness.** The setup checklist must distinguish “rounds exist” from “valid round flow.”
5. **[HIGH] Remove impossible actions.** Do not show Cancel for an already cancelled event or Publish Result for a cancelled/non-started round.
6. **[HIGH] Make the faculty round workflow state-driven.** Start, shortlist, publish, and lock must be visually and functionally sequential.
7. **[HIGH] Prepare a complete student demonstration path.** The demo student must be eligible for open individual and team events so registration can be shown without changing records during the presentation.
8. **[HIGH] Correct contradictory wording.** Remove “read-only” where editing exists and use non-final wording on shortlist rounds.

## 9. Should Improve Before Handover

1. **[MEDIUM]** Add task-oriented student and faculty dashboard sections rather than relying mainly on count cards.
2. **[MEDIUM]** Break the admin event form into steps or collapsible sections with a final validation summary.
3. **[MEDIUM]** Replace free-text section restrictions and manual student year input with validated/derived values.
4. **[MEDIUM]** Show team minimum size, current size, and enrollment readiness in one compact block.
5. **[MEDIUM]** Group duplicate notifications and make type labels human-readable.
6. **[MEDIUM]** Add downloadable import templates and an import preview with row-level validation.
7. **[MEDIUM]** Make student result messages event-specific and round progress sentence-based.
8. **[MEDIUM]** Reduce profile-page duplication and move history/statistics into focused tabs.
9. **[MEDIUM]** Test every generated PDF/Excel file with empty data, individual events, team events, and media.
10. **[MEDIUM]** Complete a real-device mobile test of team registration, round operation, and wide tables.

## 10. Can Improve Later

- **[LOW]** Notification preferences and digest frequency.
- **[LOW]** College SSO or centralized identity integration.
- **[LOW]** Calendar integration for registration deadlines and event schedules.
- **[LOW]** Saved analytics filters and presentation mode.
- **[LOW]** Certificate generation and certificate email delivery.
- **[LOW]** Public event archive/gallery with approved media.
- **[LOW]** Native mobile app or push notifications.
- **[LOW]** Scheduled reports and automated annual archival.

## 11. Suggested Simplifications

- Replace the many independent event-state controls with one guided lifecycle: Draft -> Published -> Registration Closed -> Ongoing -> Completed.
- Keep faculty controls contextual. A round should expose only the one action valid now, plus a clear explanation of the next action.
- Turn team registration into three visible steps: Create/Join Team, Reach Minimum Members, Enroll Team.
- Keep the student dashboard focused on Available Now, My Next Action, My Progress, and My Points.
- Keep the faculty dashboard focused on Needs Attention, Upcoming Deadlines, and Recently Completed.
- Keep the admin dashboard executive-level and leave detailed charts on Analytics.
- Split the long admin event detail into Setup, Participation, Results, Reports, and Archive sections or anchored tabs.
- Separate profile editing, password/security, and performance history instead of placing all of them in one continuous page.

## 12. Final Recommendation

**Needs major fixes before demo.**

The application has enough functionality to be genuinely valuable, and its strongest modules already reduce substantial manual work. The recommendation is driven by trust rather than missing scope: cancelled events exposing publish actions, contradictory lifecycle data, incomplete denied-page states, and missing final-round readiness can make faculty or administrators doubt the system during a demonstration.

After the critical lifecycle locks, permission-state rendering, wording corrections, and clean demo data are addressed, this can become a strong principal demo without adding any new major feature. Real deployment should follow a fresh end-to-end rehearsal of one individual event and one team event from publication through registration, round progression, final result, points, report, notification, and archive.
