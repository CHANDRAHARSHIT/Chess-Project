import type { Request } from "express";

export interface RegionInfo {
  country: string;
  countryCode: string;
  currency: string;
  locale: string;
}

const COUNTRY_CODE_TO_DATA: Record<string, { country: string; currency: string; locale: string }> = {
  IN: { country: "India", currency: "INR", locale: "en-IN" },
  US: { country: "United States", currency: "USD", locale: "en-US" },
  GB: { country: "United Kingdom", currency: "GBP", locale: "en-GB" },
  AU: { country: "Australia", currency: "AUD", locale: "en-AU" },
  NZ: { country: "New Zealand", currency: "NZD", locale: "en-NZ" },
  CA: { country: "Canada", currency: "CAD", locale: "en-CA" },
  DE: { country: "Germany", currency: "EUR", locale: "de-DE" },
  FR: { country: "France", currency: "EUR", locale: "fr-FR" },
  IT: { country: "Italy", currency: "EUR", locale: "it-IT" },
  ES: { country: "Spain", currency: "EUR", locale: "es-ES" },
  NL: { country: "Netherlands", currency: "EUR", locale: "nl-NL" },
  JP: { country: "Japan", currency: "JPY", locale: "ja-JP" },
  CN: { country: "China", currency: "CNY", locale: "zh-CN" },
  SG: { country: "Singapore", currency: "SGD", locale: "en-SG" },
  CH: { country: "Switzerland", currency: "CHF", locale: "de-CH" },
  HK: { country: "Hong Kong", currency: "HKD", locale: "zh-HK" },
  BR: { country: "Brazil", currency: "BRL", locale: "pt-BR" },
  MX: { country: "Mexico", currency: "MXN", locale: "es-MX" },
  KR: { country: "South Korea", currency: "KRW", locale: "ko-KR" },
  SE: { country: "Sweden", currency: "SEK", locale: "sv-SE" },
  NO: { country: "Norway", currency: "NOK", locale: "nb-NO" },
  DK: { country: "Denmark", currency: "DKK", locale: "da-DK" },
  ZA: { country: "South Africa", currency: "ZAR", locale: "en-ZA" },
  AE: { country: "United Arab Emirates", currency: "AED", locale: "ar-AE" },
  SA: { country: "Saudi Arabia", currency: "SAR", locale: "ar-SA" },
  TH: { country: "Thailand", currency: "THB", locale: "th-TH" },
  ID: { country: "Indonesia", currency: "IDR", locale: "id-ID" },
  MY: { country: "Malaysia", currency: "MYR", locale: "ms-MY" },
  PH: { country: "Philippines", currency: "PHP", locale: "en-PH" },
  VN: { country: "Vietnam", currency: "VND", locale: "vi-VN" },
  EU: { country: "Europe", currency: "EUR", locale: "en-DE" },
};

const DEFAULT_REGION: RegionInfo = {
  country: "New Zealand",
  countryCode: "NZ",
  currency: "NZD",
  locale: "en-NZ",
};

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "Asia/Tokyo": "JP",
  "Pacific/Auckland": "NZ",
};

const LANG_PREFIX_TO_COUNTRY: Record<string, string> = {
  "hi": "IN",
  "ja": "JP",
  "de": "DE",
  "fr": "FR",
  "it": "IT",
  "es": "ES",
  "ko": "KR",
  "zh": "CN",
  "pt": "BR",
  "ru": "RU",
};

export class RegionService {
  /**
   * Detects the user's country following priority:
   * 1. Cloudflare headers (cf-ipcountry)
   * 2. Vercel Geo headers (x-vercel-ip-country)
   * 3. IP Geolocation API (fallback fetch)
   * 4. Accept-Language
   * 5. Timezone
   * 6. Default to NZ
   */
  public static async detectRegion(req?: Request): Promise<RegionInfo> {
    if (!req) {
      return DEFAULT_REGION;
    }

    try {
      // 0. Development override via query param
      if (process.env.NODE_ENV !== "production") {
        const queryCountry = req.query?.country as string;
        if (queryCountry) {
          const info = this.getRegionByCountryCode(queryCountry);
          if (info) {
            console.log(`[RegionService]: Detected region via dev query param: ${info.countryCode}`);
            return info;
          }
        }
      }

      // 1. Cloudflare headers
      const cfCountry = req.headers["cf-ipcountry"];
      if (typeof cfCountry === "string" && cfCountry.length === 2 && cfCountry !== "XX") {
        const info = this.getRegionByCountryCode(cfCountry);
        if (info) {
          console.log(`[RegionService]: Detected region via Cloudflare: ${info.countryCode}`);
          return info;
        }
      }

      // 2. Vercel Geo headers
      const vercelCountry = req.headers["x-vercel-ip-country"];
      if (typeof vercelCountry === "string" && vercelCountry.length === 2) {
        const info = this.getRegionByCountryCode(vercelCountry);
        if (info) {
          console.log(`[RegionService]: Detected region via Vercel: ${info.countryCode}`);
          return info;
        }
      }

      // Extract client IP address
      const rawIp =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        "";

      // If IP is valid public IP, perform IP Geolocation API lookup
      if (rawIp && rawIp !== "127.0.0.1" && rawIp !== "::1" && !rawIp.startsWith("192.168.")) {
        try {
          const geoRes = await fetch(`https://ipapi.co/${rawIp}/json/`, {
            headers: { "User-Agent": "XLChess-App/1.0" },
            signal: AbortSignal.timeout(1500),
          });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.country_code) {
              const info = this.getRegionByCountryCode(geoData.country_code);
              if (info) {
                console.log(`[RegionService]: Detected region via IP Geolocation: ${info.countryCode}`);
                return info;
              }
            }
          }
        } catch (e) {
          // Silent fallback to next strategy
        }
      }

      // 4. Accept-Language header
      const acceptLang = req.headers["accept-language"];
      if (typeof acceptLang === "string") {
        // e.g. "en-IN,en;q=0.9,hi;q=0.8" or "en-US"
        const parts = acceptLang.split(",")[0].trim();
        if (parts.includes("-")) {
          const countryCode = parts.split("-")[1].toUpperCase();
          const info = this.getRegionByCountryCode(countryCode);
          if (info) {
            console.log(`[RegionService]: Detected region via Accept-Language country: ${info.countryCode}`);
            return info;
          }
        } else {
          const langPrefix = parts.toLowerCase();
          if (LANG_PREFIX_TO_COUNTRY[langPrefix]) {
            const info = this.getRegionByCountryCode(LANG_PREFIX_TO_COUNTRY[langPrefix]);
            if (info) {
              console.log(`[RegionService]: Detected region via Accept-Language prefix: ${info.countryCode}`);
              return info;
            }
          }
        }
      }

      // 5. Timezone header/query
      const tzHeader = (req.headers["x-timezone"] as string) || (req.query?.tz as string);
      if (tzHeader && TIMEZONE_TO_COUNTRY[tzHeader]) {
        const info = this.getRegionByCountryCode(TIMEZONE_TO_COUNTRY[tzHeader]);
        if (info) {
          console.log(`[RegionService]: Detected region via Timezone: ${info.countryCode}`);
          return info;
        }
      }
    } catch (error) {
      console.error("[RegionService]: Error detecting region, defaulting to NZ:", error);
    }

    // 6. Default to NZ
    return DEFAULT_REGION;
  }

  public static getRegionByCountryCode(countryCode: string): RegionInfo | null {
    const code = countryCode.toUpperCase();
    if (COUNTRY_CODE_TO_DATA[code]) {
      return {
        country: COUNTRY_CODE_TO_DATA[code].country,
        countryCode: code,
        currency: COUNTRY_CODE_TO_DATA[code].currency,
        locale: COUNTRY_CODE_TO_DATA[code].locale,
      };
    }
    return null;
  }
}
