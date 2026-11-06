const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const publicSiteUrl =
  configured && configured.length > 0
    ? configured.replace(/\/$/, "")
    : process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : null;
