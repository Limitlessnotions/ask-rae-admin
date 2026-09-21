"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";

function formatDate(value: any) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getTimestamp(value: any) {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getInitials(name?: string | null) {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = String(status || "").toLowerCase();

  let className = "status-badge status-neutral";

  if (
    normalized === "success" ||
    normalized === "active" ||
    normalized === "connected" ||
    normalized === "verified" ||
    normalized === "completed"
  ) {
    className = "status-badge status-success";
  }

  if (
    normalized === "failed" ||
    normalized === "disabled" ||
    normalized === "error"
  ) {
    className = "status-badge status-danger";
  }

  if (
    normalized === "processing" ||
    normalized === "pending" ||
    normalized === "trial"
  ) {
    className = "status-badge status-warning";
  }

  return (
    <span className={className}>
      {status}
    </span>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-title">
        {title}
      </div>

      {description && (
        <div className="empty-state-description">
          {description}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  description,
  count,
}: {
  title: string;
  description?: string;
  count?: string | number;
}) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>

        {description && (
          <p className="section-description">
            {description}
          </p>
        )}
      </div>

      {count !== undefined && (
        <span className="section-count">
          {count}
        </span>
      )}
    </div>
  );
}

function SocialConnection({
  platform,
  account,
}: {
  platform: string;
  account: any;
}) {
  if (!account) {
    return (
      <div className="social-card">
        <div className="social-card-top">
          <div>
            <div className="social-platform">
              {platform}
            </div>

            <div className="muted">
              No account connected
            </div>
          </div>

          <StatusBadge status="Not connected" />
        </div>
      </div>
    );
  }

  return (
    <div className="social-card">
      <div className="social-card-top">
        <div className="social-identity">
          {account.avatar ? (
            <img
              src={account.avatar}
              alt=""
              className="social-avatar"
            />
          ) : (
            <div className="social-avatar social-avatar-placeholder">
              {platform.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="social-platform">
              {platform}
            </div>

            <div className="social-name">
              {account.username
                ? `@${account.username}`
                : account.name ||
                  account.displayName ||
                  "Connected account"}
            </div>
          </div>
        </div>

        <StatusBadge status="Connected" />
      </div>

      <div className="social-details">
        {account.displayName &&
          account.username && (
            <div className="social-detail">
              <span className="muted">
                Name
              </span>

              <strong>
                {account.displayName}
              </strong>
            </div>
          )}

        {account.followersCount !== undefined && (
          <div className="social-detail">
            <span className="muted">
              Followers
            </span>

            <strong>
              {Number(account.followersCount).toLocaleString()}
            </strong>
          </div>
        )}

        {account.mediaCount !== undefined && (
          <div className="social-detail">
            <span className="muted">
              Media
            </span>

            <strong>
              {Number(account.mediaCount).toLocaleString()}
            </strong>
          </div>
        )}

        {account.connectedAt && (
          <div className="social-detail">
            <span className="muted">
              Connected
            </span>

            <strong>
              {formatDate(account.connectedAt)}
            </strong>
          </div>
        )}

        {account.expiresAt && (
          <div className="social-detail">
            <span className="muted">
              Token expires
            </span>

            <strong>
              {formatDate(account.expiresAt)}
            </strong>
          </div>
        )}
      </div>

      {Array.isArray(account.pages) &&
        account.pages.length > 0 && (
          <div className="facebook-pages">
            <div className="subsection-title">
              Facebook Pages
            </div>

            {account.pages.map((page: any) => (
              <div
                key={page.id}
                className="facebook-page"
              >
                {page.picture ? (
                  <img
                    src={page.picture}
                    alt=""
                    className="page-avatar"
                  />
                ) : (
                  <div className="page-avatar page-avatar-placeholder">
                    {(page.name || "P")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="page-info">
                  <strong>
                    {page.name || "Unnamed page"}
                  </strong>

                  {page.category && (
                    <span className="muted">
                      {page.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

export default function UserDetail() {
  const { uid } = useParams<{ uid: string }>();

  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadUser() {
    if (!uid) return;

    try {
      setError("");

      const response = await api(
        `/api/admin/users/${uid}`
      );

      setUser(response.data);
    } catch (err: any) {
      setError(
        err.message || "Unable to load user."
      );
    }
  }

  useEffect(() => {
    if (uid) {
      loadUser();
    }
  }, [uid]);

  async function toggleStatus() {
    if (!user || busy) return;

    const action = user.disabled
      ? "reactivate"
      : "suspend";

    const displayName =
      user.name ||
      user.email ||
      "this user";

    const confirmed = window.confirm(
      user.disabled
        ? `Reactivate ${displayName}?`
        : `Suspend ${displayName}?`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      await api(
        `/api/admin/users/${uid}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            disabled: !user.disabled,
          }),
        }
      );

      await loadUser();
    } catch (err: any) {
      setError(
        err.message ||
          `Unable to ${action} user.`
      );
    } finally {
      setBusy(false);
    }
  }

  const publications = useMemo(() => {
    const rows = Array.isArray(
      user?.recentPublications
    )
      ? [...user.recentPublications]
      : [];

    return rows.sort(
      (a, b) =>
        getTimestamp(
          b.publishedAt || b.createdAt
        ) -
        getTimestamp(
          a.publishedAt || a.createdAt
        )
    );
  }, [user]);

  const accountability = Array.isArray(
    user?.accountability
  )
    ? user.accountability
    : [];

  const socialAccounts =
    user?.socialAccounts || {};

  const profile = user?.profile || null;

  if (error && !user) {
    return (
      <div className="card">
        <p className="error">
          {error}
        </p>

        <button
          type="button"
          onClick={loadUser}
          className="button-secondary"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card">
        Loading user…
      </div>
    );
  }

  const socialPlatforms = [
    {
      key: "facebook",
      label: "Facebook",
    },
    {
      key: "instagram",
      label: "Instagram",
    },
    {
      key: "tiktok",
      label: "TikTok",
    },
    {
      key: "x",
      label: "X",
    },
  ];

  return (
    <div className="user-detail-page">
      {/* HEADER */}

      <div className="user-detail-header">
        <div>
          <Link
            href="/users"
            className="back-link"
          >
            ← Back to users
          </Link>

          <div className="user-title-row">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="large-user-avatar"
              />
            ) : (
              <div className="large-user-avatar avatar-placeholder">
                {getInitials(
                  user.name || user.email
                )}
              </div>
            )}

            <div>
              <h1>
                {user.name ||
                  user.email ||
                  "User"}
              </h1>

              <p className="user-email">
                {user.email || "No email"}
              </p>

              <div className="user-header-status">
                {user.disabled ? (
                  <StatusBadge status="Disabled" />
                ) : (
                  <StatusBadge status="Active" />
                )}

                {user.emailVerified && (
                  <StatusBadge status="Verified" />
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleStatus}
          disabled={busy}
          className={
            user.disabled
              ? "button-success"
              : "button-danger"
          }
        >
          {busy
            ? "Saving…"
            : user.disabled
              ? "Reactivate"
              : "Suspend"}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* ACCOUNT OVERVIEW */}

      <section className="detail-section">
        <SectionHeader title="Account overview" />

        <div className="overview-grid">
          <div className="info-card">
            <span className="muted">
              Account status
            </span>

            <strong>
              {user.disabled
                ? "Disabled"
                : "Active"}
            </strong>
          </div>

          <div className="info-card">
            <span className="muted">
              Email verification
            </span>

            <strong>
              {user.emailVerified
                ? "Verified"
                : "Not verified"}
            </strong>
          </div>

          <div className="info-card">
            <span className="muted">
              Created
            </span>

            <strong>
              {formatDate(user.createdAt)}
            </strong>
          </div>

          <div className="info-card">
            <span className="muted">
              Last sign-in
            </span>

            <strong>
              {formatDate(
                user.lastSignInAt
              )}
            </strong>
          </div>
        </div>
      </section>

      {/* PROFILE */}

      <section className="detail-section">
        <SectionHeader
          title="Profile"
          description="Information collected during Ask Rae onboarding."
        />

        {!profile ? (
          <div className="card">
            <EmptyState
              title="No profile created"
              description="This user has not created an Ask Rae profile yet."
            />
          </div>
        ) : (
          <div className="profile-grid">
            <div className="card">
              <div className="profile-field">
                <span className="muted">
                  Business name
                </span>

                <strong>
                  {profile.businessName ||
                    "—"}
                </strong>
              </div>

              <div className="profile-field">
                <span className="muted">
                  Business type
                </span>

                <strong>
                  {profile.businessType ||
                    "—"}
                </strong>
              </div>

              <div className="profile-field">
                <span className="muted">
                  Tone
                </span>

                <strong>
                  {profile.tone || "—"}
                </strong>
              </div>

              <div className="profile-field">
                <span className="muted">
                  Onboarding
                </span>

                <div>
                  {profile.onboardingCompleted ? (
                    <StatusBadge status="Completed" />
                  ) : (
                    <StatusBadge status="Incomplete" />
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="profile-field">
                <span className="muted">
                  Target audience
                </span>

                <p className="profile-text">
                  {profile.audience || "—"}
                </p>
              </div>

              <div className="profile-field">
                <span className="muted">
                  Goals
                </span>

                {Array.isArray(profile.goals) &&
                profile.goals.length > 0 ? (
                  <div className="tag-list">
                    {profile.goals.map(
                      (goal: string) => (
                        <span
                          className="tag"
                          key={goal}
                        >
                          {goal}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <span className="muted">
                    No goals
                  </span>
                )}
              </div>

              <div className="profile-field">
                <span className="muted">
                  Platforms
                </span>

                {Array.isArray(
                  profile.platforms
                ) &&
                profile.platforms.length > 0 ? (
                  <div className="tag-list">
                    {profile.platforms.map(
                      (platform: string) => (
                        <span
                          className="tag"
                          key={platform}
                        >
                          {platform}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <span className="muted">
                    No platforms
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SUBSCRIPTION */}

      <section className="detail-section">
        <SectionHeader
          title="Subscription"
          description="Current subscription information."
        />

        <div className="card">
          {!user.subscription ? (
            <EmptyState
              title="No subscription"
              description="This user currently has no subscription record."
            />
          ) : (
            <div className="overview-grid">
              <div className="info-card">
                <span className="muted">
                  Status
                </span>

                <div>
                  <StatusBadge
                    status={
                      user.subscription.status ||
                      "Unknown"
                    }
                  />
                </div>
              </div>

              <div className="info-card">
                <span className="muted">
                  Plan
                </span>

                <strong>
                  {user.subscription.plan ||
                    user.subscription.productName ||
                    "—"}
                </strong>
              </div>

              <div className="info-card">
                <span className="muted">
                  Product
                </span>

                <strong>
                  {user.subscription.productId ||
                    user.subscription.product ||
                    "—"}
                </strong>
              </div>

              <div className="info-card">
                <span className="muted">
                  Platform
                </span>

                <strong>
                  {user.subscription.platform ||
                    "—"}
                </strong>
              </div>

              <div className="info-card">
                <span className="muted">
                  Start date
                </span>

                <strong>
                  {formatDate(
                    user.subscription.startDate ||
                      user.subscription.startedAt
                  )}
                </strong>
              </div>

              <div className="info-card">
                <span className="muted">
                  Expiration
                </span>

                <strong>
                  {formatDate(
                    user.subscription.expirationDate ||
                      user.subscription.expiresAt
                  )}
                </strong>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SOCIAL CONNECTIONS */}

      <section className="detail-section">
        <SectionHeader
          title="Social connections"
          description="Connected social publishing accounts."
        />

        <div className="social-grid">
          {socialPlatforms.map(
            (platform) => (
              <SocialConnection
                key={platform.key}
                platform={platform.label}
                account={
                  socialAccounts[
                    platform.key
                  ]
                }
              />
            )
          )}
        </div>
      </section>

      {/* PUBLICATIONS */}

      <section className="detail-section">
        <div className="card">
          <SectionHeader
            title="Recent publications"
            description="Newest activity appears first."
            count={`${publications.length} records`}
          />

          {publications.length === 0 ? (
            <EmptyState
              title="No publications"
              description="This user has not published any content yet."
            />
          ) : (
            <div className="publication-list">
              {publications.map(
                (publication: any) => {
                  const date =
                    publication.publishedAt ||
                    publication.createdAt;

                  const isSuccess =
                    publication.status ===
                    "success";

                  const isFailed =
                    publication.status ===
                    "failed";

                  return (
                    <details
                      className="publication-item"
                      key={publication.id}
                    >
                      <summary className="publication-summary">
                        <div className="publication-main">
                          <div className="publication-platform">
                            {publication.platform ||
                              "Unknown platform"}
                          </div>

                          <div className="publication-type">
                            {publication.type ||
                              "—"}
                          </div>

                          <div className="publication-date">
                            {formatDate(date)}
                          </div>
                        </div>

                        <div className="publication-status">
                          <StatusBadge
                            status={
                              publication.status ||
                              "unknown"
                            }
                          />
                        </div>
                      </summary>

                      <div className="publication-details">
                        <div className="publication-meta">
                          <div>
                            <span className="muted">
                              Publication ID
                            </span>

                            <code>
                              {publication.id}
                            </code>
                          </div>

                          <div>
                            <span className="muted">
                              Target ID
                            </span>

                            <code>
                              {publication.targetId ||
                                "—"}
                            </code>
                          </div>

                          {publication.targetName && (
                            <div>
                              <span className="muted">
                                Target
                              </span>

                              <strong>
                                {
                                  publication.targetName
                                }
                              </strong>
                            </div>
                          )}

                          <div>
                            <span className="muted">
                              Created
                            </span>

                            <strong>
                              {formatDate(
                                publication.createdAt
                              )}
                            </strong>
                          </div>

                          {publication.publishedAt && (
                            <div>
                              <span className="muted">
                                Published
                              </span>

                              <strong>
                                {formatDate(
                                  publication.publishedAt
                                )}
                              </strong>
                            </div>
                          )}
                        </div>

                        {publication.content
                          ?.text && (
                          <div className="publication-content">
                            <span className="muted">
                              Content
                            </span>

                            <p>
                              {
                                publication
                                  .content.text
                              }
                            </p>
                          </div>
                        )}

                        {publication.content
                          ?.imageUrl && (
                          <div className="media-link">
                            <span className="muted">
                              Media
                            </span>

                            <a
                              href={
                                publication
                                  .content.imageUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open media
                            </a>
                          </div>
                        )}

                        {publication.error && (
                          <div className="publication-error">
                            <span className="muted">
                              Error
                            </span>

                            <p>
                              {publication.error}
                            </p>
                          </div>
                        )}

                        {isSuccess &&
                          publication.result && (
                            <div className="publication-result">
                              <span className="muted">
                                Result
                              </span>

                              <pre className="technical-data">
                                {JSON.stringify(
                                  publication.result,
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          )}

                        {isFailed && (
                          <div className="publication-note">
                            Publishing failed.
                            See the error above
                            for details.
                          </div>
                        )}
                      </div>
                    </details>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      {/* ACCOUNTABILITY */}

      <section className="detail-section">
        <div className="card">
          <SectionHeader
            title="Accountability"
            description="Goals and accountability activity."
            count={`${accountability.length} goals`}
          />

          {accountability.length === 0 ? (
            <EmptyState
              title="No accountability goals"
              description="This user has not created any accountability goals."
            />
          ) : (
            <div className="goal-list">
              {accountability.map(
                (goal: any) => (
                  <div
                    className="goal-item"
                    key={goal.id}
                  >
                    <div className="goal-header">
                      <div>
                        <h3>
                          {goal.title ||
                            goal.name ||
                            "Untitled goal"}
                        </h3>

                        {goal.description && (
                          <p className="goal-description">
                            {goal.description}
                          </p>
                        )}
                      </div>

                      <StatusBadge
                        status={
                          goal.completed
                            ? "Completed"
                            : "In progress"
                        }
                      />
                    </div>

                    <div className="goal-meta">
                      <span>
                        Created:{" "}
                        {formatDate(
                          goal.createdAt
                        )}
                      </span>

                      <span>
                        Updated:{" "}
                        {formatDate(
                          goal.updatedAt
                        )}
                      </span>

                      <span>
                        Due:{" "}
                        {formatDate(
                          goal.dueDate
                        )}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}