"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type Publication = {
  id: string;
  userId: string;
  userEmail?: string | null;
  platform?: string | null;
  type?: string | null;
  status?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  [key: string]: any;
};

type StatusFilter =
  | "all"
  | "published"
  | "processing"
  | "failed";

function getDate(publication: Publication) {
  return (
    publication.publishedAt ||
    publication.createdAt ||
    null
  );
}

function getTimestamp(publication: Publication) {
  const value = getDate(publication);

  if (!value) return 0;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}

function formatDate(publication: Publication) {
  const value = getDate(publication);

  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function normalizeStatus(publication: Publication) {
  return String(
    publication.status || "unknown"
  ).toLowerCase();
}

function getStatusLabel(publication: Publication) {
  const status = normalizeStatus(publication);

  if (status === "published") return "Published";
  if (status === "processing") return "Processing";
  if (status === "failed") return "Failed";

  return publication.status || "Unknown";
}

function StatusBadge({
  publication,
}: {
  publication: Publication;
}) {
  const status = normalizeStatus(publication);

  let className =
    "status-badge status-neutral";

  if (status === "published") {
    className =
      "status-badge status-success";
  }

  if (status === "processing") {
    className =
      "status-badge status-warning";
  }

  if (status === "failed") {
    className =
      "status-badge status-danger";
  }

  return (
    <span className={className}>
      {getStatusLabel(publication)}
    </span>
  );
}

function getUserLabel(publication: Publication) {
  return (
    publication.userEmail ||
    publication.userId ||
    "Unknown user"
  );
}

function getInitials(value: string) {
  if (!value) return "?";

  return value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

export default function PublicationsPage() {
  const [publications, setPublications] =
    useState<Publication[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [platformFilter, setPlatformFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadPublications() {
    setLoading(true);
    setError("");

    try {
      const response = await api(
        "/api/admin/publications?limit=100"
      );

      const rows = Array.isArray(response.data)
        ? response.data
        : [];

      /*
       * Always enforce newest → oldest here.
       *
       * publishedAt is preferred.
       * createdAt is used when publishedAt
       * does not exist.
       */
      rows.sort(
        (a: Publication, b: Publication) =>
          getTimestamp(b) -
          getTimestamp(a)
      );

      setPublications(rows);
    } catch (err: any) {
      setError(
        err.message ||
          "Unable to load publications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPublications();
  }, []);

  const platforms = useMemo(() => {
    const values = publications
      .map((publication) =>
        String(
          publication.platform || ""
        ).trim()
      )
      .filter(Boolean);

    return Array.from(
      new Set(values)
    ).sort((a, b) =>
      a.localeCompare(
        b,
        undefined,
        { sensitivity: "base" }
      )
    );
  }, [publications]);

  const statistics = useMemo(() => {
    let published = 0;
    let processing = 0;
    let failed = 0;

    publications.forEach(
      (publication) => {
        const status =
          normalizeStatus(
            publication
          );

        if (status === "published") {
          published++;
        } else if (
          status === "processing"
        ) {
          processing++;
        } else if (
          status === "failed"
        ) {
          failed++;
        }
      }
    );

    return {
      total: publications.length,
      published,
      processing,
      failed,
    };
  }, [publications]);

  const filteredPublications = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    const filtered =
      publications.filter(
        (publication) => {
          /*
           * Search
           */
          if (query) {
            const user =
              getUserLabel(
                publication
              ).toLowerCase();

            const userId =
              String(
                publication.userId || ""
              ).toLowerCase();

            const platform =
              String(
                publication.platform ||
                  ""
              ).toLowerCase();

            const type =
              String(
                publication.type || ""
              ).toLowerCase();

            const status =
              String(
                publication.status ||
                  ""
              ).toLowerCase();

            const matches =
              user.includes(query) ||
              userId.includes(query) ||
              platform.includes(query) ||
              type.includes(query) ||
              status.includes(query);

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
              publication
            ) !== statusFilter
          ) {
            return false;
          }

          /*
           * Platform filter
           */
          if (
            platformFilter !== "all" &&
            String(
              publication.platform ||
                ""
            ).toLowerCase() !==
              platformFilter.toLowerCase()
          ) {
            return false;
          }

          return true;
        }
      );

    /*
     * Keep filtered results newest first.
     */
    return filtered.sort(
      (a, b) =>
        getTimestamp(b) -
        getTimestamp(a)
    );
  }, [
    publications,
    search,
    statusFilter,
    platformFilter,
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    platformFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setPlatformFilter("all");
  }

  return (
    <div className="publications-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <h1>Publishing Center</h1>

          <p className="muted">
            Monitor content published
            through Ask Rae.
          </p>
        </div>

        <div className="users-count">
          {filteredPublications.length}

          {filteredPublications.length !==
            publications.length && (
            <span>
              {" "}
              of {publications.length}
            </span>
          )}{" "}
          publications
        </div>
      </div>

      {/* STATISTICS */}

      <div className="publication-stats">
        <div className="publication-stat-card">
          <span className="muted">
            Total
          </span>

          <strong>
            {statistics.total}
          </strong>
        </div>

        <div className="publication-stat-card">
          <span className="muted">
            Published
          </span>

          <strong>
            {statistics.published}
          </strong>
        </div>

        <div className="publication-stat-card">
          <span className="muted">
            Processing
          </span>

          <strong>
            {statistics.processing}
          </strong>
        </div>

        <div className="publication-stat-card">
          <span className="muted">
            Failed
          </span>

          <strong>
            {statistics.failed}
          </strong>
        </div>
      </div>

      {/* FILTERS */}

      <div className="publications-toolbar">
        <div className="publication-search">
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
            placeholder="Search user, platform, type, or status..."
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

          <option value="published">
            Published
          </option>

          <option value="processing">
            Processing
          </option>

          <option value="failed">
            Failed
          </option>
        </select>

        <select
          value={platformFilter}
          onChange={(event) =>
            setPlatformFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All platforms
          </option>

          {platforms.map(
            (platform) => (
              <option
                key={platform}
                value={platform}
              >
                {platform}
              </option>
            )
          )}
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
              loadPublications
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* TABLE */}

      <div className="card publications-table-card">
        {loading ? (
          <div className="users-loading">
            <div className="loading-spinner" />

            <span>
              Loading publications...
            </span>
          </div>
        ) : filteredPublications.length ===
          0 ? (
          <div className="users-empty">
            <div className="empty-icon">
              {hasActiveFilters
                ? "⌕"
                : "○"}
            </div>

            <h3>
              {hasActiveFilters
                ? "No publications found"
                : "No publications"}
            </h3>

            <p className="muted">
              {hasActiveFilters
                ? "Try adjusting your search or filters."
                : "There are no publication records to display."}
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
          <div className="publications-table-wrap">
            <table className="publications-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Platform</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredPublications.map(
                  (publication) => {
                    const userLabel =
                      getUserLabel(
                        publication
                      );

                    return (
                      <tr
                        key={`${publication.userId}-${publication.id}`}
                        className="publication-row"
                      >
                        {/* DATE */}

                        <td>
                          <div className="publication-date">
                            <strong>
                              {formatDate(
                                publication
                              )}
                            </strong>

                            {publication.publishedAt && (
                              <span>
                                Published
                              </span>
                            )}
                          </div>
                        </td>

                        {/* USER */}

                        <td>
                          <Link
                            href={`/users/${publication.userId}`}
                            className="publication-user"
                          >
                            <div className="publication-avatar">
                              {getInitials(
                                userLabel
                              )}
                            </div>

                            <div className="publication-user-info">
                              <strong>
                                {publication.userEmail ||
                                  "User"}
                              </strong>

                              <span>
                                {publication.userId}
                              </span>
                            </div>
                          </Link>
                        </td>

                        {/* PLATFORM */}

                        <td>
                          <span className="publication-platform">
                            {publication.platform ||
                              "—"}
                          </span>
                        </td>

                        {/* TYPE */}

                        <td>
                          <span className="publication-type">
                            {publication.type ||
                              "—"}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td>
                          <StatusBadge
                            publication={
                              publication
                            }
                          />
                        </td>

                        {/* VIEW */}

                        <td>
                          <Link
                            href={`/users/${publication.userId}`}
                            className="view-publication"
                          >
                            View user →
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