"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type AffirmationEvent = {
  id: string;
  uid?: string | null;
  event?: string | null;
  date?: string | null;
  createdAt?: string | null;
  platform?: string | null;
  timezone?: string | null;
  notificationId?: string | null;
  errorCode?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function isFailure(item: AffirmationEvent) {
  const event = String(item.event || "").toLowerCase();

  return Boolean(
    item.errorCode ||
    event.includes("error") ||
    event.includes("fail")
  );
}

function EventBadge({ event }: { event?: string | null }) {
  const value = String(event || "unknown");
  const failed = value.toLowerCase().includes("error") ||
    value.toLowerCase().includes("fail");

  return (
    <span className={`affirmation-event-badge ${failed ? "failed" : "normal"}`}>
      {value.replace(/[_-]+/g, " ")}
    </span>
  );
}

export default function AffirmationMonitoringPage() {
  const [events, setEvents] = useState<AffirmationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api(
        "/api/admin/affirmation-monitoring?limit=200"
      );

      setEvents(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err: any) {
      console.error(
        "Affirmation monitoring load error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load affirmation monitoring events."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventTypes = useMemo(
    () =>
      Array.from(
        new Set(
          events
            .map((item) => item.event)
            .filter(Boolean)
        )
      ).sort() as string[],
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.uid,
          item.event,
          item.notificationId,
          item.timezone,
          item.errorCode,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );

      const matchesEvent =
        eventFilter === "all" ||
        item.event === eventFilter;

      const matchesPlatform =
        platformFilter === "all" ||
        String(item.platform || "").toLowerCase() ===
          platformFilter;

      const matchesDate =
        !dateFilter ||
        item.date === dateFilter ||
        (item.createdAt || "").startsWith(dateFilter);

      return (
        matchesSearch &&
        matchesEvent &&
        matchesPlatform &&
        matchesDate
      );
    });
  }, [
    events,
    search,
    eventFilter,
    platformFilter,
    dateFilter,
  ]);

  const successfulEvents = events.filter(
    (item) =>
      !isFailure(item) &&
      String(item.event || "").toLowerCase().includes("success")
  ).length;

  const failedEvents = events.filter(isFailure).length;

  const uniqueUsers = new Set(
    events
      .map((item) => item.uid)
      .filter(Boolean)
  ).size;

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Affirmation Monitoring</h1>
          <p className="muted">
            Monitor affirmation notification scheduling activity.
          </p>
        </div>

        <button
          type="button"
          onClick={loadEvents}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <div className="muted">Events loaded</div>
          <div className="metric">{events.length}</div>
          <small className="muted">Latest 200 maximum</small>
        </div>

        <div className="card">
          <div className="muted">Successful events</div>
          <div className="metric">{successfulEvents}</div>
          <small className="muted">Events marked as success</small>
        </div>

        <div className="card">
          <div className="muted">Failed events</div>
          <div className="metric">{failedEvents}</div>
          <small className="muted">Errors and failures recorded</small>
        </div>

        <div className="card">
          <div className="muted">Users represented</div>
          <div className="metric">{uniqueUsers}</div>
          <small className="muted">Unique user IDs in loaded events</small>
        </div>
      </div>

      <div className="section card">
        <div className="affirmation-filters">
          <input
            type="search"
            placeholder="Search UID, notification ID, timezone..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            value={eventFilter}
            onChange={(event) =>
              setEventFilter(event.target.value)
            }
          >
            <option value="all">All event types</option>
            {eventTypes.map((event) => (
              <option key={event} value={event}>
                {event.replace(/[_-]+/g, " ")}
              </option>
            ))}
          </select>

          <select
            value={platformFilter}
            onChange={(event) =>
              setPlatformFilter(event.target.value)
            }
          >
            <option value="all">All platforms</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(event.target.value)
            }
          />

          <button
            type="button"
            className="secondary"
            onClick={() => {
              setSearch("");
              setEventFilter("all");
              setPlatformFilter("all");
              setDateFilter("");
            }}
          >
            Clear filters
          </button>
        </div>

        <div className="affirmation-table-heading">
          <div>
            <h2>Monitoring Events</h2>
            <p className="muted">
              Showing {filteredEvents.length} of {events.length} loaded events.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="muted">Loading affirmation events...</p>
        ) : error ? (
          <div className="affirmation-error">
            {error}
            <button type="button" onClick={loadEvents}>
              Try again
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="affirmation-empty">
            No affirmation monitoring events match these filters.
          </div>
        ) : (
          <div className="affirmation-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>User ID</th>
                  <th>Affirmation date</th>
                  <th>Platform</th>
                  <th>Timezone</th>
                  <th>Notification ID</th>
                  <th>Error code</th>
                  <th>Recorded at</th>
                </tr>
              </thead>

              <tbody>
                {filteredEvents.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <EventBadge event={item.event} />
                    </td>

                    <td className="affirmation-uid">
                      {item.uid || "—"}
                    </td>

                    <td>{item.date || "—"}</td>

                    <td>
                      {item.platform
                        ? item.platform.toUpperCase()
                        : "—"}
                    </td>

                    <td>{item.timezone || "—"}</td>

                    <td className="affirmation-notification-id">
                      {item.notificationId || "—"}
                    </td>

                    <td>
                      {item.errorCode ? (
                        <span className="affirmation-error-code">
                          {item.errorCode}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="affirmation-footnote">
          A schedule success event confirms that scheduling was recorded.
          It does not independently confirm that the notification was delivered
          or displayed on the device.
        </p>
      </div>
    </div>
  );
}