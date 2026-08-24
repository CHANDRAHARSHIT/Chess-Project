import type { Request } from "express";
import rollbar from "../core/config/rollbar.config.js";

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

const LANG_PREFIX_TO_COUNTRY: Record<string, string> = {
  hi: "IN",
  ja: "JP",
  de: "DE",
  fr: "FR",
  it: "IT",
  es: "ES",
  ko: "KR",
  zh: "CN",
  pt: "BR",
  ru: "RU",
};

export class RegionService {
  /**
   * Detects the user's country following priority (cheapest/most reliable first):
   * 1. Dev override via ?country= query param (non-production only)
   * 2. Cloudflare header (cf-ipcountry)
   * 3. Vercel Geo header (x-vercel-ip-country)
   * 4. Accept-Language header
   * 5. IP Geolocation API (last resort — network call, only if nothing above matched)
   * 6. Default to NZ
   */
  public static async detectRegion(req?: Request): Promise<RegionInfo> {
    if (!req) {
      return DEFAULT_REGION;
    }

    try {
      // 1. Development override via query param
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

      // 2. Cloudflare header
      const cfCountry = req.headers["cf-ipcountry"];
      if (typeof cfCountry === "string" && cfCountry.length === 2 && cfCountry !== "XX") {
        const info = this.getRegionByCountryCode(cfCountry);
        if (info) {
          console.log(`[RegionService]: Detected region via Cloudflare: ${info.countryCode}`);
          return info;
        }
      }

      // 3. Vercel Geo header
      const vercelCountry = req.headers["x-vercel-ip-country"];
      if (typeof vercelCountry === "string" && vercelCountry.length === 2) {
        const info = this.getRegionByCountryCode(vercelCountry);
        if (info) {
          console.log(`[RegionService]: Detected region via Vercel: ${info.countryCode}`);
          return info;
        }
      }

      // 4. Accept-Language header (instant, no network call)
      const acceptLang = req.headers["accept-language"];
      if (typeof acceptLang === "string") {
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

      // 5. IP Geolocation API — last resort, only reached if no header/language signal matched
      const rawIp =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        "";

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
          // Expected on network hiccups/timeouts — the header-based checks above
          // already covered the common cases, so just log at warning level.
          rollbar.warning(e as Error, req, { context: "RegionService.detectRegion:ipGeolocation" });
        }
      }
    } catch (error) {
      console.error("[RegionService]: Error detecting region, defaulting to NZ:", error);
      // Falls back to the NZ default below, so this never surfaces as a 5xx —
      // report it manually so a broken detection path doesn't go unnoticed.
      rollbar.error(error as Error, req);
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