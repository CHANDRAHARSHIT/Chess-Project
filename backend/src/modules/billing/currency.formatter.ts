const CURRENCY_SYMBOLS: Record<string, string> = {
  NZD: "NZ$",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  INR: "₹",
  JPY: "¥",
  CNY: "¥",
  SGD: "S$",
  CHF: "CHF ",
  HKD: "HK$",
  BRL: "R$",
  MXN: "MEX$",
  KRW: "₩",
  SEK: "kr ",
  NOK: "kr ",
  DKK: "kr ",
  ZAR: "R ",
  RUB: "₽",
  AED: "AED ",
  SAR: "SAR ",
  THB: "฿",
  IDR: "Rp ",
  MYR: "RM ",
  PHP: "₱",
  VND: "₫",
  TRY: "₺",
};

// Zero-decimal currencies in Stripe and general formatting
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
  "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"
]);

export class CurrencyFormatter {
  /**
   * Retrieves the currency symbol for a given currency code.
   */
  public static getSymbol(currencyCode: string): string {
    const code = currencyCode.toUpperCase();
    return CURRENCY_SYMBOLS[code] || `${code} `;
  }

  /**
   * Checks if currency is zero-decimal.
   */
  public static isZeroDecimal(currencyCode: string): boolean {
    return ZERO_DECIMAL_CURRENCIES.has(currencyCode.toUpperCase());
  }

  /**
   * Converts a standard currency amount to minor units (e.g. cents) for Stripe checkout.
   */
  public static toMinorUnits(amount: number, currencyCode: string): number {
    if (this.isZeroDecimal(currencyCode)) {
      return Math.round(amount);
    }
    return Math.round(amount * 100);
  }

  /**
   * Formats a numeric value with currency symbol.
   */
  public static format(amount: number, currencyCode: string, locale = "en-US"): string {
    const symbol = this.getSymbol(currencyCode);
    try {
      const formattedNumber = new Intl.NumberFormat(locale, {
        maximumFractionDigits: this.isZeroDecimal(currencyCode) ? 0 : 2,
        minimumFractionDigits: this.isZeroDecimal(currencyCode) ? 0 : 0,
      }).format(amount);
      return `${symbol}${formattedNumber}`;
    } catch (e) {
      return `${symbol}${amount.toFixed(this.isZeroDecimal(currencyCode) ? 0 : 2)}`;
    }
  }
}
