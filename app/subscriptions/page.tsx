"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type Subscription = {
  uid: string;
  email?: string | null;
  name?: string | null;
  status?: string | null;
  plan?: string | null;
  platform?: string | null;
  productId?: string | null;
  expiresAt?: string | null;
  startedAt?: string | null;
  startDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  foundingMember?: boolean;
  foundingSlot?: number | null;
  isTrial?: boolean;
  trialEndsAt?: string | null;
  [key: string]: any;
};

type StatusFilter =
  | "all"
  | "active"
  | "trial"
  | "expired"
  | "cancelled"
  | "inactive";

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getTimestamp(value?: string | null) {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
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

function normalizeStatus(
  subscription: Subscription
) {
  if (subscription.isTrial === true) {
    return "trial";
  }

  return String(
    subscription.status ||
      "inactive"
  ).toLowerCase();
}

function getStatusLabel(
  subscription: Subscription
) {
  const status =
    normalizeStatus(subscription);

  if (status === "active") {
    return "Active";
  }

  if (status === "trial") {
    return "Trial";
  }

  if (
    status === "cancelled" ||
    status === "canceled"
  ) {
    return "Cancelled";
  }

  if (status === "expired") {
    return "Expired";
  }

  if (status === "inactive") {
    return "Inactive";
  }

  return (
    subscription.status ||
    "Inactive"
  );
}

function StatusBadge({
  subscription,
}: {
  subscription: Subscription;
}) {
  const status =
    normalizeStatus(subscription);

  let className =
    "status-badge status-neutral";

  if (
    status === "active"
  ) {
    className =
      "status-badge status-success";
  }

  if (
    status === "trial"
  ) {
    className =
      "status-badge status-warning";
  }

  if (
    status === "expired" ||
    status === "cancelled" ||
    status === "canceled"
  ) {
    className =
      "status-badge status-danger";
  }

  return (
    <span className={className}>
      {getStatusLabel(
        subscription
      )}
    </span>
  );
}

function getPlanName(
  subscription: Subscription
) {
  if (
    subscription.foundingMember
  ) {
    if (
      subscription.foundingSlot !==
        undefined &&
      subscription.foundingSlot !==
        null
    ) {
      return `Founding #${subscription.foundingSlot}`;
    }

    return "Founding Member";
  }

  return (
    subscription.plan ||
    subscription.productName ||
    subscription.productId ||
    "—"
  );
}

function getStartDate(
  subscription: Subscription
) {
  return (
    subscription.startedAt ||
    subscription.startDate ||
    subscription.createdAt ||
    null
  );
}

function getExpirationDate(
  subscription: Subscription
) {
  return (
    subscription.expiresAt ||
    subscription.expirationDate ||
    subscription.expires ||
    null
  );
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadSubscriptions() {
    setLoading(true);
    setError("");

    try {
      const response = await api(
        "/api/admin/subscriptions?limit=100"
      );

      setSubscriptions(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err: any) {
      setError(
        err.message ||
          "Unable to load subscriptions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const filteredSubscriptions =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      const filtered =
        subscriptions.filter(
          (subscription) => {
            /*
             * Search by:
             * - name
             * - email
             * - UID
             * - product
             * - plan
             */
            if (query) {
              const name =
                subscription.name
                  ?.toLowerCase() ||
                "";

              const email =
                subscription.email
                  ?.toLowerCase() ||
                "";

              const uid =
                subscription.uid
                  ?.toLowerCase() ||
                "";

              const plan =
                subscription.plan
                  ?.toLowerCase() ||
                "";

              const product =
                subscription.productId
                  ?.toLowerCase() ||
                "";

              const matches =
                name.includes(query) ||
                email.includes(query) ||
                uid.includes(query) ||
                plan.includes(query) ||
                product.includes(query);

              if (!matches) {
                return false;
              }
            }

            /*
             * Status filter
             */
            if (
              statusFilter !== "all" &&
              normalizeStatus(
                subscription
              ) !== statusFilter
            ) {
              return false;
            }

            return true;
          }
        );

      /*
       * Alphabetical user ordering.
       *
       * Name → email → UID
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

        const comparison =
          nameA.localeCompare(
            nameB,
            undefined,
            {
              sensitivity: "base",
            }
          );

        if (comparison !== 0) {
          return comparison;
        }

        return String(
          a.uid
        ).localeCompare(
          String(b.uid)
        );
      });
    }, [
      subscriptions,
      search,
      statusFilter,
    ]);

  const statistics = useMemo(() => {
    let active = 0;
    let trial = 0;
    let expired = 0;
    let cancelled = 0;
    let inactive = 0;

    subscriptions.forEach(
      (subscription) => {
        const status =
          normalizeStatus(
            subscription
          );

        if (status === "active") {
          active++;
        } else if (
          status === "trial"
        ) {
          trial++;
        } else if (
          status === "expired"
        ) {
          expired++;
        } else if (
          status === "cancelled" ||
          status === "canceled"
        ) {
          cancelled++;
        } else {
          inactive++;
        }
      }
    );

    return {
      total: subscriptions.length,
      active,
      trial,
      expired,
      cancelled,
      inactive,
    };
  }, [subscriptions]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all";

  return (
    <div className="subscriptions-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <h1>Subscriptions</h1>

          <p className="muted">
            Manage and inspect Ask Rae
            subscription records.
          </p>
        </div>

        <div className="users-count">
          {filteredSubscriptions.length}
          {filteredSubscriptions.length !==
            subscriptions.length && (
            <span>
              {" "}
              of {subscriptions.length}
            </span>
          )}{" "}
          subscriptions
        </div>
      </div>

      {/* STATISTICS */}

      <div className="subscription-stats">
        <div className="subscription-stat-card">
          <span className="muted">
            Total
          </span>

          <strong>
            {statistics.total}
          </strong>
        </div>

        <div className="subscription-stat-card">
          <span className="muted">
            Active
          </span>

          <strong>
            {statistics.active}
          </strong>
        </div>

        <div className="subscription-stat-card">
          <span className="muted">
            Trial
          </span>

          <strong>
            {statistics.trial}
          </strong>
        </div>

        <div className="subscription-stat-card">
          <span className="muted">
            Expired
          </span>

          <strong>
            {statistics.expired}
          </strong>
        </div>

        <div className="subscription-stat-card">
          <span className="muted">
            Cancelled
          </span>

          <strong>
            {statistics.cancelled}
          </strong>
        </div>
      </div>

      {/* FILTER BAR */}

      <div className="subscriptions-toolbar">
        <div className="subscription-search">
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
            placeholder="Search user, email, plan, or product..."
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target
                .value as StatusFilter
            )
          }
        >
          <option value="all">
            All statuses
          </option>

          <option value="active">
            Active
          </option>

          <option value="trial">
            Trial
          </option>

          <option value="expired">
            Expired
          </option>

          <option value="cancelled">
            Cancelled
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>

        {hasActiveFilters && (
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
          <span>{error}</span>

          <button
            type="button"
            onClick={
              loadSubscriptions
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* TABLE */}

      <div className="card subscriptions-table-card">
        {loading ? (
          <div className="users-loading">
            <div className="loading-spinner" />

            <span>
              Loading subscriptions...
            </span>
          </div>
        ) : filteredSubscriptions.length ===
          0 ? (
          <div className="users-empty">
            <div className="empty-icon">
              {hasActiveFilters
                ? "⌕"
                : "○"}
            </div>

            <h3>
              {hasActiveFilters
                ? "No subscriptions found"
                : "No subscriptions"}
            </h3>

            <p className="muted">
              {hasActiveFilters
                ? "Try adjusting your search or status filter."
                : "There are no subscription records to display."}
            </p>

            {hasActiveFilters && (
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
          <div className="subscriptions-table-wrap">
            <table className="subscriptions-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Platform</th>
                  <th>Product</th>
                  <th>Started</th>
                  <th>Expires</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredSubscriptions.map(
                  (subscription) => {
                    const startDate =
                      getStartDate(
                        subscription
                      );

                    const expirationDate =
                      getExpirationDate(
                        subscription
                      );

                    return (
                      <tr
                        key={
                          subscription.uid
                        }
                        className="subscription-row"
                      >
                        {/* USER */}

                        <td>
                          <Link
                            href={`/users/${subscription.uid}`}
                            className="subscription-user"
                          >
                            <div className="subscription-avatar">
                              {getInitials(
                                subscription.name,
                                subscription.email
                              )}
                            </div>

                            <div className="subscription-user-info">
                              <strong>
                                {subscription.name ||
                                  "Unnamed user"}
                              </strong>

                              <span>
                                {subscription.email ||
                                  subscription.uid}
                              </span>
                            </div>
                          </Link>
                        </td>

                        {/* PLAN */}

                        <td>
                          <div className="subscription-plan">
                            <strong>
                              {getPlanName(
                                subscription
                              )}
                            </strong>

                            {subscription.foundingMember && (
                              <span className="founding-label">
                                Founding member
                              </span>
                            )}

                            {subscription.isTrial && (
                              <span className="trial-label">
                                Trial
                              </span>
                            )}
                          </div>
                        </td>

                        {/* STATUS */}

                        <td>
                          <StatusBadge
                            subscription={
                              subscription
                            }
                          />
                        </td>

                        {/* PLATFORM */}

                        <td>
                          <span className="subscription-platform">
                            {subscription.platform ||
                              "—"}
                          </span>
                        </td>

                        {/* PRODUCT */}

                        <td>
                          <span className="subscription-product">
                            {subscription.productId ||
                              "—"}
                          </span>
                        </td>

                        {/* START */}

                        <td>
                          <span className="subscription-date">
                            {formatDate(
                              startDate
                            )}
                          </span>
                        </td>

                        {/* EXPIRATION */}

                        <td>
                          <span className="subscription-date">
                            {formatDate(
                              expirationDate
                            )}
                          </span>

                          {subscription.trialEndsAt && (
                            <span className="subscription-trial-date">
                              Trial ends{" "}
                              {formatDate(
                                subscription.trialEndsAt
                              )}
                            </span>
                          )}
                        </td>

                        {/* VIEW */}

                        <td>
                          <Link
                            href={`/users/${subscription.uid}`}
                            className="view-user"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}