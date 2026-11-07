"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "../lib/firebase";
import { api } from "../lib/api";

type Admin = {
  uid: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Users",
    href: "/users",
  },
  {
    label: "Subscriptions",
    href: "/subscriptions",
  },
  {
    label: "Social",
    href: "/social",
  },
  {
    label: "Publishing",
    href: "/publications",
  },
  {
    label: "Audit Log",
    href: "/audit-logs",
  },
  {
    label: "System Health",
    href: "/system-health",
  },
{
  label: "Affirmation Monitoring",
  href: "/affirmation-monitoring",
},


];

function isActivePath(
  pathname: string,
  href: string
) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

function getInitials(
  admin: Admin
) {
  const value =
    admin.name ||
    admin.email ||
    "Admin";

  return value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();

  const [ready, setReady] =
    useState(false);

  const [signedIn, setSignedIn] =
    useState(false);

  const [admin, setAdmin] =
    useState<Admin | null>(null);

  const [accessError, setAccessError] =
    useState("");

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          setSignedIn(!!user);
          setAccessError("");

          if (!user) {
            setAdmin(null);
            setReady(true);

            if (
              path !== "/login"
            ) {
              router.replace(
                "/login"
              );
            }

            return;
          }

          /*
           * User is authenticated with
           * Firebase.
           *
           * Now verify that the backend
           * recognizes this user as an
           * Ask Rae administrator.
           */
          try {
            const response =
              await api(
                "/api/admin/me"
              );

            setAdmin(
              response.admin
            );

            setReady(true);

            if (
              path === "/login"
            ) {
              router.replace(
                "/dashboard"
              );
            }
          } catch (error: any) {
            console.error(
              "Admin authorization failed:",
              error
            );

            setAdmin(null);

            setAccessError(
              error.message ||
                "Admin access required."
            );

            setReady(true);
          }
        }
      );

    return unsubscribe;
  }, [path, router]);

  async function handleSignOut() {
    await signOut(auth);

    setAdmin(null);
    setSignedIn(false);

    router.replace("/login");
  }

  /*
   * LOGIN PAGE
   */

  if (path === "/login") {
    if (!ready) {
      return (
        <div className="login">
          <div>
            Loading…
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }

  /*
   * AUTH CHECK
   */

  if (!ready) {
    return (
      <div className="login">
        <div className="admin-loading">
          <div className="loading-spinner" />

          <span>
            Verifying admin access...
          </span>
        </div>
      </div>
    );
  }

  /*
   * NOT SIGNED IN
   */

  if (!signedIn) {
    return null;
  }

  /*
   * SIGNED IN BUT NOT AN ADMIN
   */

  if (!admin) {
    return (
      <div className="admin-access-denied">
        <div className="admin-access-card">
          <div className="access-denied-icon">
            !
          </div>

          <h1>
            Admin access required
          </h1>

          <p>
            {accessError ||
              "This account does not have permission to access Ask Rae Admin."}
          </p>

          <button
            type="button"
            onClick={
              handleSignOut
            }
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  /*
   * AUTHORIZED ADMIN
   */

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          Ask Rae Admin
        </div>

        <nav className="nav">
          {navigation.map(
            (item) => {
              const active =
                isActivePath(
                  path,
                  item.href
                );

              return (
                <Link
                  key={item.href}
                  href={
                    item.href
                  }
                  className={
                    active
                      ? "active"
                      : ""
                  }
                >
                  {
                    item.label
                  }
                </Link>
              );
            }
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile">
            <div className="admin-avatar">
              {getInitials(
                admin
              )}
            </div>

            <div className="admin-profile-info">
              <strong>
                {admin.name ||
                  admin.email ||
                  "Administrator"}
              </strong>

              {admin.name &&
                admin.email && (
                  <span>
                    {
                      admin.email
                    }
                  </span>
                )}

              <span className="admin-role">
                {admin.role ||
                  "admin"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="secondary admin-signout"
            onClick={
              handleSignOut
            }
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        {children}
      </main>
    </div>
  );
}