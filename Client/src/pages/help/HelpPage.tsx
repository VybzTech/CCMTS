/**
 * Port of the PHP app's pages/help.php - static reference content,
 * adapted to this app's simplified 3-role model and the API's
 * Low/Medium/High priority + underscored status values (rather than
 * the PHP app's Normal/Urgent + DHL-routing rules, which have no
 * equivalent here - see types/api.ts).
 */
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { formatRoleLabel } from '../../utils/format';
import type { LetterStatus } from '../../types/api';

/**
 * The happy path only. Undelivered is deliberately NOT in this list:
 * it's a terminal branch, not the step after Delivered (see
 * WORKFLOW_BRANCHES below), and rendering it as the tail of a straight
 * chain told the reader a letter goes Delivered -> Undelivered, which
 * it never does.
 */
const WORKFLOW_MAIN_PATH: LetterStatus[] = [
  'Pending_Approval',
  'Approved',
  'Assigned',
  'In_Transit',
  'Delivered',
];

/**
 * Where a letter can leave the happy path. Both land on Undelivered -
 * the API has no separate "Rejected" status (see the note on
 * WORKFLOW_DESCRIPTIONS), so the two exits are distinguished here by
 * the step they branch off rather than by status.
 */
const WORKFLOW_BRANCHES: Partial<Record<LetterStatus, { to: LetterStatus; label: string }>> = {
  Pending_Approval: { to: 'Undelivered', label: 'If the Admin rejects the registration' },
  In_Transit: { to: 'Undelivered', label: 'If the delivery cannot be completed' },
};

export function HelpPage() {
  const { user } = useAuth();

  return (
    <AppShell pageTitle="Help & Guide">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Help &amp; User Guide</h1>
            <p>Learn how to use CCMS effectively.</p>
          </div>
        </div>

        <Card>
          <CardHeader title={`Your Role: ${user ? formatRoleLabel(user.role) : ''}`} />
          <CardBody>
            {user?.role === 'ODU' && (
              <>
                <p className="text-secondary mb-md">
                  As an <strong>ODU</strong> user, you register letters and track their delivery status
                  for your own directorate.
                </p>
                <ul className="capability-list">
                  <li><i className="fas fa-check text-success" /> Register new letters for delivery</li>
                  <li><i className="fas fa-check text-success" /> Upload multiple letters at once</li>
                  <li><i className="fas fa-check text-success" /> View and track delivery status for your directorate's letters</li>
                  <li><i className="fas fa-times text-danger" /> Approve or reject letters</li>
                  <li><i className="fas fa-times text-danger" /> Assign couriers</li>
                </ul>
              </>
            )}
            {user?.role === 'Admin' && (
              <>
                <p className="text-secondary mb-md">
                  As an <strong>Admin</strong>, you review, approve, and assign every letter in the
                  system, and manage the courier and directorate roster.
                </p>
                <ul className="capability-list">
                  <li><i className="fas fa-check text-success" /> Approve or reject pending letters</li>
                  <li><i className="fas fa-check text-success" /> Assign couriers via Courier Allocation (manually or auto-assign)</li>
                  <li><i className="fas fa-check text-success" /> Update delivery status</li>
                  <li><i className="fas fa-check text-success" /> Manage couriers and directorates</li>
                </ul>
              </>
            )}
            {user?.role === 'Courier' && (
              <>
                <p className="text-secondary mb-md">
                  As a <strong>Courier</strong>, you carry out the deliveries assigned to you and
                  record what happened to each one. You only ever see your own assignments.
                </p>
                <ul className="capability-list">
                  <li><i className="fas fa-check text-success" /> See every letter assigned to you under My Deliveries</li>
                  <li><i className="fas fa-check text-success" /> Mark a letter In Transit when you collect it</li>
                  <li><i className="fas fa-check text-success" /> Mark a letter Delivered, attaching a proof-of-delivery photo</li>
                  <li><i className="fas fa-check text-success" /> Mark a letter Undelivered with the reason it failed</li>
                  <li><i className="fas fa-times text-danger" /> Register, approve, or reject letters</li>
                  <li><i className="fas fa-times text-danger" /> See other couriers' or other directorates' letters</li>
                </ul>
              </>
            )}
            {user?.role === 'Management' && (
              <>
                <p className="text-secondary mb-md">
                  As <strong>Management</strong>, you have organization-wide visibility into every
                  directorate, every Admin capability, and the ability to create and manage user
                  accounts for any role.
                </p>
                <ul className="capability-list">
                  <li><i className="fas fa-check text-success" /> View organization-wide statistics and compare directorate performance</li>
                  <li><i className="fas fa-check text-success" /> Approve or reject pending letters</li>
                  <li><i className="fas fa-check text-success" /> Assign couriers via Courier Allocation (manually or auto-assign)</li>
                  <li><i className="fas fa-check text-success" /> Manage couriers and directorates</li>
                  <li><i className="fas fa-check text-success" /> Create and manage ODU, Admin, Management, and Courier accounts</li>
                </ul>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Letter Workflow" />
          <CardBody>
            <p className="text-secondary mb-md">
              A letter follows the path below. Two steps can send it off that path to{' '}
              <strong>Undelivered</strong>, which is where it stops.
            </p>
            <ol className="workflow-diagram">
              {WORKFLOW_MAIN_PATH.map((status, index) => {
                const branch = WORKFLOW_BRANCHES[status];
                return (
                  <li
                    className={`workflow-step${index === WORKFLOW_MAIN_PATH.length - 1 ? ' is-last' : ''}`}
                    key={status}
                  >
                    <span className="workflow-marker" aria-hidden="true">{index + 1}</span>
                    <div className="workflow-content">
                      <StatusBadge status={status} />
                      <p>{WORKFLOW_DESCRIPTIONS[status]}</p>

                      {branch && (
                        <div className="workflow-branch">
                          <span className="workflow-branch-label">{branch.label}</span>
                          <StatusBadge status={branch.to} />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="workflow-terminal-note">
              <StatusBadge status="Undelivered" />
              <span>{WORKFLOW_DESCRIPTIONS.Undelivered}</span>
            </p>
          </CardBody>
        </Card>

        <div className="charts-grid">
          <Card>
            <CardHeader title="Priority Levels" />
            <CardBody>
              <div className="status-guide">
                <div className="status-item">
                  <PriorityBadge priority="Low" />
                  <p>Standard correspondence, regular timeline</p>
                </div>
                <div className="status-item">
                  <PriorityBadge priority="Medium" />
                  <p>Default priority for most letters</p>
                </div>
                <div className="status-item">
                  <PriorityBadge priority="High" />
                  <p>Time-sensitive, needs immediate attention</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Frequently Asked Questions" />
            <CardBody>
              <div className="faq-list">
                <div className="faq-item">
                  <h4>How do I track a letter?</h4>
                  <p>Open "All Letters" in the sidebar and click into any letter to see its current status and delivery timeline.</p>
                </div>
                <div className="faq-item">
                  <h4>Why is my letter still pending?</h4>
                  <p>Letters need Admin approval before a courier can be assigned. Contact your administrator if it's been pending a long time.</p>
                </div>
                <div className="faq-item">
                  <h4>What does "auto-assign" do?</h4>
                  <p>It hands a batch of approved letters to the allocation engine, which assigns each to an available courier automatically.</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

// Keyed by the full LetterStatus union so this stays a
// compile-time-checked exhaustive map. A rejected registration also
// ends up as Undelivered (see reject_letter in
// Server/src/controllers/letter.controller.js) - there's no separate
// status for it, the rejection reason lives on the letter's timeline
// instead.
const WORKFLOW_DESCRIPTIONS: Record<LetterStatus, string> = {
  Pending_Approval: 'Letter submitted, waiting for Admin review',
  Approved: 'Admin approved - waiting for courier assignment',
  Assigned: 'Courier assigned to deliver the letter',
  In_Transit: 'Courier is actively delivering the letter',
  Delivered: 'Successfully delivered to the recipient',
  Undelivered: 'Delivery failed, or the registration was rejected before approval - check notes for the reason',
};
