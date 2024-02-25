import { logger } from "../client/client";
import { db } from "./database";

export async function refreshToken() {
  logger.info(`[Tx] Renewing Access Token`);
  let headers = new Headers();
  headers.append(`Content-Type`, `application/json`);
  let body = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: encodeURIComponent(process.env.REFRESH_TOKEN!),
  };

  const request = new Request("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body),
  });
  const response = await fetch(request);

  const responseData: { access_token: string; refresh_token: string } =
    await response.json();

  let newAccessToken = responseData.access_token;
  let newRefreshToken = responseData.refresh_token;
  if (!newAccessToken || !newRefreshToken) {
    throw new Error();
  } else {
    process.env.USER_ACCESS_TOKEN = newAccessToken;
    process.env.REFRESH_TOKEN = newRefreshToken;
  }
}

export async function isTwitchTokenValid(token: string) {
  let headers = new Headers() as Headers;
  headers.append(`Authorization`, `OAuth ${token}`);
  let request = {
    method: "GET",
    headers: headers,
    redirect: "follow",
  } as RequestInit;
  const response = await fetch("https://id.twitch.tv/oauth2/validate", request);
  let valid = response.status === 200;
  logger.info(`[Tx-ValidatedToken] ${valid}`);
  return valid;
}

export function initAccount(userID: string | number) {
  let stmt = db.prepare("SELECT money FROM users WHERE user = ?");
  if (!stmt.get(userID)) {
    stmt = db.prepare("INSERT INTO users (user, money) VALUES (?, ?)");
    stmt.run(userID, 0);
  }
}

export function checkNickname(userID: string | number) {
  let stmt = db.prepare("SELECT nickname FROM users WHERE user = ?");
  return stmt.get(userID)?.nickname || null;
}