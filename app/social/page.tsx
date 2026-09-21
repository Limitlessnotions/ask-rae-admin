"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type SocialCounts = {
  facebook?: number;
  instagram?: number;
  tiktok?: number;
  x?: number;
  [key: string]: number | undefined;
};

type DashboardData = {
  social: SocialCounts;
};

const PLATFORM_META: Record<
  string,
  {
    label: string;
    description: string;
    icon: string;
  }
> = {
  facebook: {
    label: "Facebook",
    description: "Connected Facebook accounts",
    icon: "f",
  },
  instagram: {
    label: "Instagram",
    description: "Connected Instagram accounts",
    icon: "◎",
  },
  tiktok: {
    label: "TikTok",
    description: "Connected TikTok accounts",
    icon: "♪",
  },
  x: {
    label: "X",
    description: "Connected X accounts",
    icon: "𝕏",
  },
};

function formatPlatformName(platform: string) {
  return (
    PLATFORM_META[platform]?.label ||
    platform.charAt(0).toUpperCase() +
      platform.slice(1)
  );
}

export default function Social() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  async function loadSocial() {
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
          "Unable to load social accounts."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSocial();
  }, []);

  const platforms = useMemo(() => {
    const social =
      data?.social || {};

    return Object.keys(PLATFORM_META).map(
      (platform) => ({
        platform,
        count:
          Number(social[platform] || 0),
        ...PLATFORM_META[platform],
      })
    );
  }, [data]);

  const totalConnections = useMemo(
    () =>
      platforms.reduce(
        (total, platform) =>
          total + platform.count,
        0
      ),
    [platforms]
  );

  const connectedPlatforms = useMemo(
    () =>
      platforms.filter(
        (platform) =>
          platform.count > 0
      ).length,
    [platforms]
  );

  if (loading) {
    return (
      <div className="social-page">
        <div className="users-loading">
          <div className="loading-spinner" />
          <span>
            Loading social accounts...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="social-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <h1>Social Accounts</h1>

          <p className="muted">
            Monitor social-platform connections
            across Ask Rae.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadSocial}
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
            onClick={loadSocial}
          >
            Retry
          </button>
        </div>
      )}

      {/* OVERVIEW */}

      <div className="social-overview">
        <div className="social-overview-card">
          <span className="muted">
            Total connections
          </span>

          <strong>
            {totalConnections}
          </strong>

          <span className="social-overview-detail">
            Across all platforms
          </span>
        </div>

        <div className="social-overview-card">
          <span className="muted">
            Platforms connected
          </span>

          <strong>
            {connectedPlatforms}
            <span className="total-platforms">
              {" "}
              / {platforms.length}
            </span>
          </strong>

          <span className="social-overview-detail">
            With at least one account
          </span>
        </div>
      </div>

      {/* PLATFORM CARDS */}

      <div className="section">
        <div className="section-heading">
          <div>
            <h2>Platform connections</h2>

            <p className="muted">
              Current connection counts from
              the Ask Rae backend.
            </p>
          </div>
        </div>

        <div className="social-platform-grid">
          {platforms.map(
            ({
              platform,
              count,
              label,
              description,
              icon,
            }) => (
              <div
                className="social-platform-card"
                key={platform}
              >
                <div className="social-platform-top">
                  <div
                    className={`social-platform-icon social-${platform}`}
                  >
                    {icon}
                  </div>

                  <span
                    className={
                      count > 0
                        ? "connection-status connected"
                        : "connection-status"
                    }
                  >
                    {count > 0
                      ? "Connected"
                      : "No connections"}
                  </span>
                </div>

                <div className="social-platform-name">
                  {label}
                </div>

                <div className="social-platform-count">
                  {count}
                </div>

                <div className="muted">
                  {description}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* SECURITY */}

      <div className="section">
        <div className="card security-card">
          <div className="security-icon">
            ✓
          </div>

          <div>
            <h3>Credential security</h3>

            <p className="muted">
              OAuth access tokens, refresh
              tokens, client secrets, and other
              authentication credentials are
              excluded from the admin API
              responses.
            </p>

            <p className="muted">
              Administrators can see connection
              status and aggregate counts without
              being exposed to provider
              credentials.
            </p>
          </div>
        </div>
      </div>

      {/* DATA LIMITATION */}

      <div className="section">
        <div className="card social-note">
          <strong>
            Current visibility
          </strong>

          <p className="muted">
            This page currently displays
            platform-level connection counts.
            Individual connected accounts are
            not exposed by the current admin
            endpoint.
          </p>
        </div>
      </div>
    </div>
  );
}