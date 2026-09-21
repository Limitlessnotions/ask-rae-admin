"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type AuditLog = {
  id: string;
  actorUid?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  result?: string | null;
  metadata?: Record<string, any> | null;
  createdAt?: string | null;
  [key: string]: any;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getTimestamp(log: AuditLog) {
  if (!log.createdAt) return 0;

  const timestamp = new Date(
    log.createdAt
  ).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}

function normalize(value?: string | null) {
  return String(value || "").toLowerCase();
}

function formatAction(action?: string | null) {
  if (!action) return "Unknown";

  return action
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function formatTargetType(
  targetType?: string | null
) {
  if (!targetType) return "—";

  return targetType
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function ResultBadge({
  result,
}: {
  result?: string | null;
}) {
  const value = normalize(result);

  let className =
    "status-badge status-neutral";

  if (value === "success") {
    className =
      "status-badge status-success";
  }

  if (
    value === "failed" ||
    value === "failure" ||
    value === "error"
  ) {
    className =
      "status-badge status-danger";
  }

  return (
    <span className={className}>
      {result || "Unknown"}
    </span>
  );
}

function Metadata({
  metadata,
}: {
  metadata?: Record<string, any> | null;
}) {
  if (
    !metadata ||
    Object.keys(metadata).length === 0
  ) {
    return (
      <span className="muted">
        No metadata
      </span>
    );
  }

  return (
    <pre className="audit-metadata">
      {JSON.stringify(
        metadata,
        null,
        2
      )}
    </pre>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] =
    useState<AuditLog[]>([]);

  const [search, setSearch] =
    useState("");

  const [resultFilter, setResultFilter] =
    useState("all");

  const [actionFilter, setActionFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [expandedId, setExpandedId] =
    useState<string | null>(null);

  async function loadLogs() {
    setLoading(true);
    setError("");

    try {
      const response = await api(
        "/api/admin/audit-logs?limit=100"
      );

      const rows = Array.isArray(
        response.data
      )
        ? response.data
        : [];

      /*
       * Always show newest audit events first.
       */
      rows.sort(
        (a: AuditLog, b: AuditLog) =>
          getTimestamp(b) -
          getTimestamp(a)
      );

      setLogs(rows);
    } catch (err: any) {
      setError(
        err.message ||
          "Unable to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const actions = useMemo(() => {
    return Array.from(
      new Set(
        logs
          .map((log) =>
            String(
              log.action || ""
            ).trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(
        b,
        undefined,
        {
          sensitivity: "base",
        }
      )
    );
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return logs
      .filter((log) => {
        if (query) {
          const searchable = [
            log.actorEmail,
            log.actorUid,
            log.actorRole,
            log.action,
            log.targetType,
            log.targetId,
            log.result,
            JSON.stringify(
              log.metadata || {}
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (
            !searchable.includes(query)
          ) {
            return false;
          }
        }

        if (
          resultFilter !== "all" &&
          normalize(log.result) !==
            resultFilter
        ) {
          return false;
        }

        if (
          actionFilter !== "all" &&
          log.action !== actionFilter
        ) {
          return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          getTimestamp(b) -
          getTimestamp(a)
      );
  }, [
    logs,
    search,
    resultFilter,
    actionFilter,
  ]);

  const statistics = useMemo(() => {
    let success = 0;
    let failed = 0;

    logs.forEach((log) => {
      const result =
        normalize(log.result);

      if (result === "success") {
        success++;
      }

      if (
        result === "failed" ||
        result === "failure" ||
        result === "error"
      ) {
        failed++;
      }
    });

    return {
      total: logs.length,
      success,
      failed,
    };
  }, [logs]);

  const hasFilters =
    search.trim() !== "" ||
    resultFilter !== "all" ||
    actionFilter !== "all";

  function clearFilters() {
    setSearch("");
    setResultFilter("all");
    setActionFilter("all");
  }

  return (
    <div className="audit-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <h1>Audit Log</h1>

          <p className="muted">
            Track administrative actions and
            system changes.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadLogs}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {/* STATISTICS */}

      <div className="audit-stats">
        <div className="audit-stat-card">
          <span className="muted">
            Total events
          </span>

          <strong>
            {statistics.total}
          </strong>
        </div>

        <div className="audit-stat-card">
          <span className="muted">
            Successful
          </span>

          <strong>
            {statistics.success}
          </strong>
        </div>

        <div className="audit-stat-card">
          <span className="muted">
            Failed
          </span>

          <strong>
            {statistics.failed}
          </strong>
        </div>
      </div>

      {/* FILTERS */}

      <div className="audit-toolbar">
        <div className="audit-search">
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
            placeholder="Search admin, action, target, or metadata..."
          />
        </div>

        <select
          value={actionFilter}
          onChange={(event) =>
            setActionFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All actions
          </option>

          {actions.map((action) => (
            <option
              key={action}
              value={action}
            >
              {formatAction(action)}
            </option>
          ))}
        </select>

        <select
          value={resultFilter}
          onChange={(event) =>
            setResultFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All results
          </option>

          <option value="success">
            Success
          </option>

          <option value="failed">
            Failed
          </option>

          <option value="error">
            Error
          </option>
        </select>

        {hasFilters && (
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
            onClick={loadLogs}
          >
            Retry
          </button>
        </div>
      )}

      {/* TABLE */}

      <div className="card audit-table-card">
        {loading ? (
          <div className="users-loading">
            <div className="loading-spinner" />

            <span>
              Loading audit logs...
            </span>
          </div>
        ) : filteredLogs.length ===
          0 ? (
          <div className="users-empty">
            <div className="empty-icon">
              {hasFilters
                ? "⌕"
                : "○"}
            </div>

            <h3>
              {hasFilters
                ? "No audit events found"
                : "No audit events"}
            </h3>

            <p className="muted">
              {hasFilters
                ? "Try adjusting your search or filters."
                : "Administrative activity will appear here."}
            </p>

            {hasFilters && (
              <button
                type="button"
                className="clear-filters-button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Result</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map(
                  (log) => {
                    const expanded =
                      expandedId ===
                      log.id;

                    return (
                      <>
                        <tr
                          key={log.id}
                          className="audit-row"
                        >
                          {/* TIME */}

                          <td>
                            <span className="audit-time">
                              {formatDate(
                                log.createdAt
                              )}
                            </span>
                          </td>

                          {/* ADMIN */}

                          <td>
                            <div className="audit-admin">
                              <strong>
                                {log.actorEmail ||
                                  "Unknown admin"}
                              </strong>

                              {log.actorRole && (
                                <span>
                                  {log.actorRole}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* ACTION */}

                          <td>
                            <span className="audit-action">
                              {formatAction(
                                log.action
                              )}
                            </span>
                          </td>

                          {/* TARGET */}

                          <td>
                            <div className="audit-target">
                              <strong>
                                {formatTargetType(
                                  log.targetType
                                )}
                              </strong>

                              {log.targetId ? (
                                <span>
                                  {log.targetId}
                                </span>
                              ) : (
                                <span>
                                  —
                                </span>
                              )}
                            </div>
                          </td>

                          {/* RESULT */}

                          <td>
                            <ResultBadge
                              result={
                                log.result
                              }
                            />
                          </td>

                          {/* DETAILS */}

                          <td>
                            {log.metadata &&
                            Object.keys(
                              log.metadata
                            ).length > 0 ? (
                              <button
                                type="button"
                                className="audit-details-button"
                                onClick={() =>
                                  setExpandedId(
                                    expanded
                                      ? null
                                      : log.id
                                  )
                                }
                              >
                                {expanded
                                  ? "Hide"
                                  : "View"}
                              </button>
                            ) : (
                              <span className="muted">
                                —
                              </span>
                            )}
                          </td>
                        </tr>

                        {expanded && (
                          <tr
                            key={`${log.id}-details`}
                            className="audit-details-row"
                          >
                            <td
                              colSpan={6}
                            >
                              <div>
                                <div className="audit-details-title">
                                  Event metadata
                                </div>

                                <Metadata
                                  metadata={
                                    log.metadata
                                  }
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
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