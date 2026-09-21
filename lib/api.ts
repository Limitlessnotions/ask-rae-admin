import { auth } from "./firebase";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function api(
  path: string,
  options: RequestInit = {}
) {
  const user = auth.currentUser;

  console.log("[ADMIN API] Request:", path);
  console.log("[ADMIN API] Current user:", user?.email || "none");

  if (!user) {
    throw new Error("Not authenticated");
  }

  const token = await user.getIdToken();

  console.log("[ADMIN API] Firebase token obtained");

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    console.error(
      "[ADMIN API] Request timed out after 30 seconds:",
      path
    );

    controller.abort();
  }, 30000);

  try {
    console.log(
      "[ADMIN API] Fetching:",
      `${BASE}${path}`
    );

    const response = await fetch(`${BASE}${path}`, {
      ...options,

      headers: {
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },

      cache: "no-store",

      signal: controller.signal,
    });

    console.log(
      "[ADMIN API] Response received:",
      response.status,
      response.statusText
    );

    console.log(
      "[ADMIN API] Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    const text = await response.text();

    console.log(
      "[ADMIN API] Response body received. Length:",
      text.length
    );

    console.log(
      "[ADMIN API] Response body preview:",
      text.substring(0, 500)
    );

    let body: any = {};

    if (text) {
      try {
        body = JSON.parse(text);
      } catch (parseError) {
        console.error(
          "[ADMIN API] JSON parse error:",
          parseError
        );

        throw new Error(
          `Server returned invalid JSON (${response.status})`
        );
      }
    }

    if (!response.ok) {
      throw new Error(
        body?.message ||
          `Request failed with status ${response.status}`
      );
    }

    console.log(
      "[ADMIN API] Request completed successfully:",
      path
    );

    return body;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.error(
        "[ADMIN API] Request aborted/timed out:",
        path
      );

      throw new Error(
        "Request timed out after 30 seconds."
      );
    }

    console.error(
      "[ADMIN API] Request failed:",
      path,
      error
    );

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}