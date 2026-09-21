"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type DashboardData = {
  users: {
    total: number;
  };
  subscriptions: {
    active: number;
    trial: number;
    founding: {
      count: number;
      limit: number;
      remaining: number;
      soldOut: boolean;
    };
  };
  social: {
    facebook?: number;
    instagram?: number;
    tiktok?: number;
    x?: number;
  };
  publishing: {
    total: number;
    published: number;
    processing: number;
    failed: number;
  };
  generatedAt?: string;
  limitation?: string | null;
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getPercentage(
  value: number,
  total: number
) {
  if (!total) return 0;

  return Math.round(
    (value / total) * 100
  );
}

function StatusPill({
  children,
  type = "neutral",
}: {
  children: React.ReactNode;
  type?: "success" | "warning" | "danger" | "neutral";
}) {
  return (
    <span
      className={`dashboard-status dashboard-status-${type}`}
    >
      {children}
    </span>
  );
}

export default function Dashboard() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await api(
        "/api/admin/dashboard"
      );

      setData(response.data);
    } catch (err: any) {
      setError(
        err.message ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const socialTotal = useMemo(() => {
    if (!data) return 0;

    return (
      Number(data.social.facebook || 0) +
      Number(data.social.instagram || 0) +
      Number(data.social.tiktok || 0) +
      Number(data.social.x || 0)
    );
  }, [data]);

  const publishingRate = useMemo(() => {
    if (!data?.publishing.total) {
      return 0;
    }

    return getPercentage(
      data.publishing.published,
      data.publishing.total
    );
  }, [data]);

  const foundingPercentage = useMemo(() => {
    if (
      !data?.subscriptions.founding
        .limit
    ) {
      return 0;
    }

    return getPercentage(
      data.subscriptions.founding.count,
      data.subscriptions.founding.limit
    );
  }, [data]);

  if (loading && !data) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner" />

          <span>
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-page">
        <div className="error-banner">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadDashboard}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="dashboard-page">
      {/* HEADER */}

      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>

          <p className="muted">
            Ask Rae operational overview
          </p>
        </div>

        <div className="dashboard-header-actions">
          {data.generatedAt && (
            <span className="dashboard-last-updated">
              Updated{" "}
              {formatDate(
                data.generatedAt
              )}
            </span>
          )}

          <button
            type="button"
            className="refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {/* ERROR WHILE REFRESHING */}

      {error && (
        <div className="error-banner">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadDashboard}
          >
            Retry
          </button>
        </div>
      )}

      {/* PRIMARY METRICS */}

      <div className="dashboard-metrics">
        <Link
          href="/users"
          className="dashboard-metric-card"
        >
          <div className="dashboard-metric-label">
            Users
          </div>

          <div className="dashboard-metric-value">
            {data.users.total}
          </div>

          <div className="dashboard-metric-link">
            View users →
          </div>
        </Link>

        <Link
          href="/subscriptions"
          className="dashboard-metric-card"
        >
          <div className="dashboard-metric-label">
            Active subscriptions
          </div>

          <div className="dashboard-metric-value">
            {data.subscriptions.active}
          </div>

          <div className="dashboard-metric-secondary">
            {data.subscriptions.trial}{" "}
            trial
            {data.subscriptions.trial ===
            1
              ? ""
              : "s"}
          </div>
        </Link>

        <Link
          href="/subscriptions"
          className="dashboard-metric-card"
        >
          <div className="dashboard-metric-label">
            Founding members
          </div>

          <div className="dashboard-metric-value">
            {data.subscriptions.founding.count}
            <span className="metric-denominator">
              {" "}
              /{" "}
              {
                data.subscriptions
                  .founding.limit
              }
            </span>
          </div>

          <div className="dashboard-progress">
            <div
              className="dashboard-progress-bar"
              style={{
                width: `${Math.min(
                  foundingPercentage,
                  100
                )}%`,
              }}
            />
          </div>

          <div className="dashboard-metric-secondary">
            {data.subscriptions.founding
              .soldOut
              ? "Sold out"
              : `${data.subscriptions.founding.remaining} remaining`}
          </div>
        </Link>

        <Link
          href="/publications"
          className="dashboard-metric-card"
        >
          <div className="dashboard-metric-label">
            Total publications
          </div>

          <div className="dashboard-metric-value">
            {data.publishing.total}
          </div>

          <div className="dashboard-metric-secondary">
            {publishingRate}% published
          </div>
        </Link>
      </div>

      {/* OPERATIONAL STATUS */}

      <div className="dashboard-section-grid">
        {/* PUBLISHING */}

        <div className="card dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Publishing</h2>

              <p className="muted">
                Current publication
                pipeline status.
              </p>
            </div>

            <Link
              href="/publications"
              className="dashboard-panel-link"
            >
              View all →
            </Link>
          </div>

          <div className="publishing-overview">
            <div className="publishing-main-number">
              <strong>
                {data.publishing.published}
              </strong>

              <span>
                published
              </span>
            </div>

            <div className="publishing-status-list">
              <div className="publishing-status-row">
                <span>
                  Published
                </span>

                <StatusPill type="success">
                  {
                    data.publishing
                      .published
                  }
                </StatusPill>
              </div>

              <div className="publishing-status-row">
                <span>
                  Processing
                </span>

                <StatusPill type="warning">
                  {
                    data.publishing
                      .processing
                  }
                </StatusPill>
              </div>

              <div className="publishing-status-row">
                <span>
                  Failed
                </span>

                <StatusPill type="danger">
                  {
                    data.publishing
                      .failed
                  }
                </StatusPill>
              </div>
            </div>
          </div>
        </div>

        {/* SOCIAL */}

        <div className="card dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>
                Social connections
              </h2>

              <p className="muted">
                Connected accounts across
                supported platforms.
              </p>
            </div>

            <Link
              href="/social"
              className="dashboard-panel-link"
            >
              View all →
            </Link>
          </div>

          <div className="social-dashboard-total">
            <strong>
              {socialTotal}
            </strong>

            <span>
              total connections
            </span>
          </div>

          <div className="social-dashboard-list">
            <div className="social-dashboard-row">
              <span>
                Facebook
              </span>

              <strong>
                {data.social.facebook ||
                  0}
              </strong>
            </div>

            <div className="social-dashboard-row">
              <span>
                Instagram
              </span>

              <strong>
                {data.social.instagram ||
                  0}
              </strong>
            </div>

            <div className="social-dashboard-row">
              <span>
                TikTok
              </span>

              <strong>
                {data.social.tiktok ||
                  0}
              </strong>
            </div>

            <div className="social-dashboard-row">
              <span>X</span>

              <strong>
                {data.social.x || 0}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}

      <div className="section">
        <div className="dashboard-panel-header">
          <div>
            <h2>Quick access</h2>

            <p className="muted">
              Frequently used administration
              areas.
            </p>
          </div>
        </div>

        <div className="dashboard-quick-actions">
          <Link
            href="/users"
            className="dashboard-action"
          >
            <strong>
              Manage users
            </strong>

            <span>
              View accounts and user
              activity →
            </span>
          </Link>

          <Link
            href="/subscriptions"
            className="dashboard-action"
          >
            <strong>
              Subscriptions
            </strong>

            <span>
              Review plans and subscription
              status →
            </span>
          </Link>

          <Link
            href="/publications"
            className="dashboard-action"
          >
            <strong>
              Publishing Center
            </strong>

            <span>
              Monitor publication activity
              →
            </span>
          </Link>

          <Link
            href="/system-health"
            className="dashboard-action"
          >
            <strong>
              System Health
            </strong>

            <span>
              Check integrations and services
              →
            </span>
          </Link>
        </div>
      </div>

      {/* LIMITATION */}

      {data.limitation && (
        <div className="dashboard-limitation">
          <strong>
            Data coverage
          </strong>

          <span>
            {data.limitation}
          </span>
        </div>
      )}
    </div>
  );
}