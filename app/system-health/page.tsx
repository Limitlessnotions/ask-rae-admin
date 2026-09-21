"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type HealthChecks = {
  backend?: string;
  firestore?: string;
  openai?: string;
  cloudinary?: string;
  revenueCat?: string;
  meta?: string;
  tiktok?: string;
  x?: string;
  [key: string]: string | undefined;
};

type HealthData = {
  checks: HealthChecks;
  checkedAt?: string;
};

const CHECK_META: Record<
  string,
  {
    label: string;
    description: string;
  }
> = {
  backend: {
    label: "Backend API",
    description:
      "Express backend availability",
  },
  firestore: {
    label: "Firestore",
    description:
      "Firebase Firestore connectivity",
  },
  openai: {
    label: "OpenAI",
    description:
      "OpenAI API configuration",
  },
  cloudinary: {
    label: "Cloudinary",
    description:
      "Media storage configuration",
  },
  revenueCat: {
    label: "RevenueCat",
    description:
      "Subscription webhook configuration",
  },
  meta: {
    label: "Meta",
    description:
      "Facebook / Instagram configuration",
  },
  tiktok: {
    label: "TikTok",
    description:
      "TikTok integration configuration",
  },
  x: {
    label: "X",
    description:
      "X integration configuration",
  },
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function normalizeStatus(
  value?: string
) {
  return String(
    value || ""
  ).toLowerCase();
}

function getStatusLabel(
  value?: string
) {
  const status =
    normalizeStatus(value);

  if (status === "healthy") {
    return "Healthy";
  }

  if (status === "configured") {
    return "Configured";
  }

  if (status === "missing") {
    return "Missing";
  }

  if (status === "unhealthy") {
    return "Unhealthy";
  }

  return value || "Unknown";
}

function StatusBadge({
  status,
}: {
  status?: string;
}) {
  const normalized =
    normalizeStatus(status);

  let className =
    "status-badge status-neutral";

  if (
    normalized === "healthy" ||
    normalized === "configured"
  ) {
    className =
      "status-badge status-success";
  }

  if (normalized === "missing") {
    className =
      "status-badge status-warning";
  }

  if (normalized === "unhealthy") {
    className =
      "status-badge status-danger";
  }

  return (
    <span className={className}>
      {getStatusLabel(status)}
    </span>
  );
}

export default function SystemHealthPage() {
  const [data, setData] =
    useState<HealthData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadHealth() {
    setLoading(true);
    setError("");

    try {
      const response = await api(
        "/api/admin/system-health"
      );

      setData(response.data);
    } catch (err: any) {
      setError(
        err.message ||
          "Unable to load system health."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHealth();
  }, []);

  const checks = useMemo(() => {
    if (!data?.checks) {
      return [];
    }

    return Object.entries(
      CHECK_META
    ).map(([key, meta]) => ({
      key,
      ...meta,
      status:
        data.checks[key] ||
        "unknown",
    }));
  }, [data]);

  const summary = useMemo(() => {
    let healthy = 0;
    let configured = 0;
    let missing = 0;
    let unhealthy = 0;
    let unknown = 0;

    checks.forEach((check) => {
      const status =
        normalizeStatus(
          check.status
        );

      if (status === "healthy") {
        healthy++;
      } else if (
        status === "configured"
      ) {
        configured++;
      } else if (
        status === "missing"
      ) {
        missing++;
      } else if (
        status === "unhealthy"
      ) {
        unhealthy++;
      } else {
        unknown++;
      }
    });

    return {
      total: checks.length,
      healthy,
      configured,
      missing,
      unhealthy,
      unknown,
    };
  }, [checks]);

  if (loading) {
    return (
      <div className="system-health-page">
        <div className="users-loading">
          <div className="loading-spinner" />

          <span>
            Checking system health...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="system-health-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <h1>System Health</h1>

          <p className="muted">
            Monitor backend services and
            integration configuration.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadHealth}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="error-banner">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadHealth}
          >
            Retry
          </button>
        </div>
      )}

      {/* OVERVIEW */}

      <div className="health-overview">
        <div className="health-overview-card">
          <span className="muted">
            Services checked
          </span>

          <strong>
            {summary.total}
          </strong>
        </div>

        <div className="health-overview-card">
          <span className="muted">
            Healthy
          </span>

          <strong>
            {summary.healthy}
          </strong>
        </div>

        <div className="health-overview-card">
          <span className="muted">
            Configured
          </span>

          <strong>
            {summary.configured}
          </strong>
        </div>

        <div className="health-overview-card">
          <span className="muted">
            Attention
          </span>

          <strong>
            {summary.missing +
              summary.unhealthy +
              summary.unknown}
          </strong>
        </div>
      </div>

      {/* LAST CHECK */}

      <div className="health-last-check">
        <div>
          <strong>
            System status
          </strong>

          <span className="muted">
            Last checked{" "}
            {formatDate(
              data?.checkedAt
            )}
          </span>
        </div>

        <StatusBadge
          status={
            summary.unhealthy > 0
              ? "unhealthy"
              : summary.missing > 0
                ? "missing"
                : "healthy"
          }
        />
      </div>

      {/* SERVICE CHECKS */}

      <div className="section">
        <div className="section-heading">
          <div>
            <h2>
              Service checks
            </h2>

            <p className="muted">
              Current status reported by
              the Ask Rae backend.
            </p>
          </div>
        </div>

        <div className="health-check-grid">
          {checks.map((check) => (
            <div
              className="health-check-card"
              key={check.key}
            >
              <div className="health-check-header">
                <div>
                  <h3>
                    {check.label}
                  </h3>

                  <p className="muted">
                    {check.description}
                  </p>
                </div>

                <StatusBadge
                  status={
                    check.status
                  }
                />
              </div>

              <div className="health-check-value">
                <span className="health-status-dot" />

                {getStatusLabel(
                  check.status
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECURITY NOTE */}

      <div className="section">
        <div className="card health-security-note">
          <div className="health-security-icon">
            ✓
          </div>

          <div>
            <h3>
              Configuration visibility
            </h3>

            <p className="muted">
              This page only reports whether
              required services and environment
              configuration are available. Secret
              keys, tokens, and credentials are
              never displayed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}