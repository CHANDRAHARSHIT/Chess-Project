/**
 * opening.ts (service)
 * Fetches chess opening data from the backend API.
 * Follows the same static-class pattern as PaymentService.
 */

import type { Opening, OpeningsListResponse, OpeningResponse } from "../types/opening";

export class OpeningService {
  /**
   * Fetches all openings from the backend.
   */
  static async getAllOpenings(): Promise<Opening[]> {
    try {
      const response = await fetch("/api/openings");
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch openings.");
      }
      const json: OpeningsListResponse = await response.json();
      return json.data.openings;
    } catch (error: any) {
      console.error("[OpeningService.getAllOpenings] Error:", error);
      return [];
    }
  }

  /**
   * Fetches a single opening by its database ID.
   */
  static async getOpeningById(id: string): Promise<Opening | null> {
    try {
      const response = await fetch(`/api/openings/${id}`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch opening.");
      }
      const json: OpeningResponse = await response.json();
      return json.data.opening;
    } catch (error: any) {
      console.error("[OpeningService.getOpeningById] Error:", error);
      return null;
    }
  }
}
