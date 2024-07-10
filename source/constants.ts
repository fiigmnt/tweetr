// AUTHORIZATION HEADERS

const cookies = {
  auth_token: "dc0606bdebfb392a9965878adf67845cb2c07779",
  ct0: "9258b570e387648188a87798492185eddae72613b7d14d834fb0d73ea6b5c6d47a8806f52011a137f5845e63e9878ba6ade856770426c3c8ba5b57ec9b5495ee260bbc77b2a297c079ebd4aa734e4c72",
};

const authorization =
  "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

const xCrsfToken =
  "9258b570e387648188a87798492185eddae72613b7d14d834fb0d73ea6b5c6d47a8806f52011a137f5845e63e9878ba6ade856770426c3c8ba5b57ec9b5495ee260bbc77b2a297c079ebd4aa734e4c72";

const cookieString = Object.entries(cookies)
  .map(([key, value]) => `${key}=${value}`)
  .join("; ");

export const headers = {
  authorization,
  "content-type": "application/json",
  "x-csrf-token": xCrsfToken,
  cookie: cookieString,
};
