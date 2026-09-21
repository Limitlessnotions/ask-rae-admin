"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type User = {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  disabled: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  emailVerified: boolean;
  subscription: any | null;
};

type StatusFilter =
  | "all"
  | "active"
  | "disabled";

type VerificationFilter =
  | "all"
  | "verified"
  | "unverified";

type SubscriptionFilter =
  | "all"
  | "subscribed"
  | "none";

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getInitials(
  name?: string | null,
  email?: string | null
) {
  const value =
    name ||
    email ||
    "User";

  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

function hasSubscription(
  subscription: any
) {
  return (
    subscription !== null &&
    subscription !== undefined
  );
}

function getSubscriptionLabel(
  subscription: any
) {
  if (!subscription) {
    return "No subscription";
  }

  if (subscription.status) {
    return String(
      subscription.status
    );
  }

  if (subscription.plan) {
    return String(
      subscription.plan
    );
  }

  if (subscription.productId) {
    return String(
      subscription.productId
    );
  }

  return "Subscribed";
}

function SubscriptionBadge({
  subscription,
}: {
  subscription: any;
}) {
  if (!subscription) {
    return (
      <span className="status-badge status-neutral">
        No subscription
      </span>
    );
  }

  const status = String(
    subscription.status || ""
  ).toLowerCase();

  if (
    status === "active"
  ) {
    return (
      <span className="status-badge status-success">
        Active
      </span>
    );
  }

  if (
    status === "trial"
  ) {
    return (
      <span className="status-badge status-warning">
        Trial
      </span>
    );
  }

  if (
    status === "cancelled" ||
    status === "canceled" ||
    status === "expired" ||
    status === "inactive"
  ) {
    return (
      <span className="status-badge status-danger">
        {subscription.status}
      </span>
    );
  }

  return (
    <span className="status-badge status-neutral">
      {getSubscriptionLabel(
        subscription
      )}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] =
    useState<User[]>([]);

  const [nextPageToken, setNextPageToken] =
    useState<string | null>(null);

  const [pageTokens, setPageTokens] =
    useState<string[]>([]);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [
    verificationFilter,
    setVerificationFilter,
  ] = useState<VerificationFilter>(
    "all"
  );

  const [
    subscriptionFilter,
    setSubscriptionFilter,
  ] = useState<SubscriptionFilter>(
    "all"
  );

  async function loadUsers(
    pageToken?: string
  ) {
    setLoading(true);
    setError("");

    try {
      const query = pageToken
        ? `/api/admin/users?limit=100&pageToken=${encodeURIComponent(
            pageToken
          )}`
        : "/api/admin/users?limit=100";

      const response = await api(query);

      setUsers(
        Array.isArray(response.users)
          ? response.users
          : []
      );

      setNextPageToken(
        response.nextPageToken ||
          null
      );
    } catch (err: any) {
      setError(
        err.message ||
          "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    const filtered = users.filter((user) => {
      /*
       * Search
       */
      if (query) {
        const name =
          user.name
            ?.toLowerCase() || "";

        const email =
          user.email
            ?.toLowerCase() || "";

        const uid =
          user.uid
            ?.toLowerCase() || "";

        const matchesSearch =
          name.includes(query) ||
          email.includes(query) ||
          uid.includes(query);

        if (!matchesSearch) {
          return false;
        }
      }

      /*
       * Account status
       */
      if (
        statusFilter === "active" &&
        user.disabled
      ) {
        return false;
      }

      if (
        statusFilter === "disabled" &&
        !user.disabled
      ) {
        return false;
      }

      /*
       * Email verification
       */
      if (
        verificationFilter ===
          "verified" &&
        !user.emailVerified
      ) {
        return false;
      }

      if (
        verificationFilter ===
          "unverified" &&
        user.emailVerified
      ) {
        return false;
      }

      /*
       * Subscription
       */
      if (
        subscriptionFilter ===
          "subscribed" &&
        !hasSubscription(
          user.subscription
        )
      ) {
        return false;
      }

      if (
        subscriptionFilter ===
          "none" &&
        hasSubscription(
          user.subscription
        )
      ) {
        return false;
      }

      return true;
    });

    /*
     * Sort users alphabetically.
     *
     * Priority:
     * 1. Name
     * 2. Email if name is missing
     * 3. UID as final tie-breaker
     */
    return filtered.sort((a, b) => {
      const nameA = (
        a.name ||
        a.email ||
        a.uid ||
        ""
      ).trim();

      const nameB = (
        b.name ||
        b.email ||
        b.uid ||
        ""
      ).trim();

      const nameComparison =
        nameA.localeCompare(
          nameB,
          undefined,
          {
            sensitivity: "base",
          }
        );

      if (nameComparison !== 0) {
        return nameComparison;
      }

      return String(a.uid).localeCompare(
        String(b.uid)
      );
    });
  }, [
    users,
    search,
    statusFilter,
    verificationFilter,
    subscriptionFilter,
  ]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setVerificationFilter("all");
    setSubscriptionFilter("all");
  }

  function hasActiveFilters() {
    return (
      search.trim() !== "" ||
      statusFilter !== "all" ||
      verificationFilter !==
        "all" ||
      subscriptionFilter !==
        "all"
    );
  }

  async function goToNextPage() {
    if (!nextPageToken) return;

    setPageTokens((current) => [
      ...current,
      nextPageToken,
    ]);

    setCurrentPage(
      (current) => current + 1
    );

    await loadUsers(
      nextPageToken
    );
  }

  async function goToPreviousPage() {
    if (currentPage <= 1) return;

    const tokens = [...pageTokens];

    tokens.pop();

    const previousToken =
      tokens.length > 0
        ? tokens[tokens.length - 1]
        : undefined;

    setPageTokens(tokens);

    setCurrentPage(
      (current) => current - 1
    );

    await loadUsers(
      previousToken
    );
  }

  return (
    <>
      <div className="users-page">
        {/* PAGE HEADER */}

        <div className="page-header">
          <div>
            <h1>Users</h1>

            <p className="muted">
              Manage and inspect Ask Rae
              user accounts.
            </p>
          </div>

          <div className="users-count">
            {filteredUsers.length}
            {filteredUsers.length !==
              users.length && (
              <span>
                {" "}
                of {users.length}
              </span>
            )}{" "}
            users
          </div>
        </div>

        {/* FILTER BAR */}

        <div className="users-toolbar">
          <div className="user-search">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />
              <path d="m20 20-3.5-3.5" />
            </svg>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search name, email, or user ID..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as StatusFilter
              )
            }
          >
            <option value="all">
              All statuses
            </option>

            <option value="active">
              Active
            </option>

            <option value="disabled">
              Disabled
            </option>
          </select>

          <select
            value={verificationFilter}
            onChange={(event) =>
              setVerificationFilter(
                event.target
                  .value as VerificationFilter
              )
            }
          >
            <option value="all">
              All verification
            </option>

            <option value="verified">
              Verified
            </option>

            <option value="unverified">
              Unverified
            </option>
          </select>

          <select
            value={subscriptionFilter}
            onChange={(event) =>
              setSubscriptionFilter(
                event.target
                  .value as SubscriptionFilter
              )
            }
          >
            <option value="all">
              All subscriptions
            </option>

            <option value="subscribed">
              Subscribed
            </option>

            <option value="none">
              No subscription
            </option>
          </select>

          {hasActiveFilters() && (
            <button
              type="button"
              className="clear-filters"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}
        </div>

        {/* ERROR */}

        {error && (
          <div className="error-banner">
            {error}

            <button
              type="button"
              onClick={() =>
                loadUsers()
              }
            >
              Retry
            </button>
          </div>
        )}

        {/* TABLE */}

        <div className="card users-table-card">
          {loading ? (
            <div className="users-loading">
              <div className="loading-spinner" />
              <span>
                Loading users...
              </span>
            </div>
          ) : filteredUsers.length ===
            0 ? (
            <div className="users-empty">
              <div className="empty-icon">
                {hasActiveFilters()
                  ? "⌕"
                  : "○"}
              </div>

              <h3>
                {hasActiveFilters()
                  ? "No users found"
                  : "No users"}
              </h3>

              <p className="muted">
                {hasActiveFilters()
                  ? "Try adjusting your search or filters."
                  : "There are no user accounts to display."}
              </p>

              {hasActiveFilters() && (
                <button
                  type="button"
                  className="clear-filters-button"
                  onClick={
                    clearFilters
                  }
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Status</th>
                    <th>Verification</th>
                    <th>Subscription</th>
                    <th>Created</th>
                    <th>Last sign-in</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={user.uid}
                        className="user-row"
                      >
                        <td>
                          <Link
                            href={`/users/${user.uid}`}
                            className="user-cell"
                          >
                            {user.photoURL ? (
                              <img
                                src={
                                  user.photoURL
                                }
                                alt=""
                                className="table-avatar"
                              />
                            ) : (
                              <div className="table-avatar avatar-placeholder">
                                {getInitials(
                                  user.name,
                                  user.email
                                )}
                              </div>
                            )}

                            <div className="user-cell-info">
                              <strong>
                                {user.name ||
                                  "Unnamed user"}
                              </strong>

                              <span>
                                {user.email ||
                                  "No email"}
                              </span>
                            </div>
                          </Link>
                        </td>

                        <td>
                          {user.disabled ? (
                            <span className="status-badge status-danger">
                              Disabled
                            </span>
                          ) : (
                            <span className="status-badge status-success">
                              Active
                            </span>
                          )}
                        </td>

                        <td>
                          {user.emailVerified ? (
                            <span className="status-badge status-success">
                              Verified
                            </span>
                          ) : (
                            <span className="status-badge status-warning">
                              Unverified
                            </span>
                          )}
                        </td>

                        <td>
                          <SubscriptionBadge
                            subscription={
                              user.subscription
                            }
                          />
                        </td>

                        <td>
                          <span className="table-date">
                            {formatDate(
                              user.createdAt
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="table-date">
                            {formatDate(
                              user.lastSignInAt
                            )}
                          </span>
                        </td>

                        <td>
                          <Link
                            href={`/users/${user.uid}`}
                            className="view-user"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINATION */}

        {!loading &&
          users.length > 0 && (
            <div className="pagination">
              <button
                type="button"
                disabled={
                  currentPage <= 1
                }
                onClick={
                  goToPreviousPage
                }
              >
                ← Previous
              </button>

              <span>
                Page {currentPage}
              </span>

              <button
                type="button"
                disabled={
                  !nextPageToken
                }
                onClick={
                  goToNextPage
                }
              >
                Next →
              </button>
            </div>
          )}
      </div>
    </>
  );
}