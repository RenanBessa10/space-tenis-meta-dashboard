import axios from "axios";
import type { DashboardSummaryResponse } from "../types/dashboard";

type ApiErrorResponse = {
  detail?: string;
  error?: string;
  message?: string;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export async function fetchDashboardSummary(
  dateStart: string,
  dateEnd: string
): Promise<DashboardSummaryResponse> {
  try {
    const res = await api.get<DashboardSummaryResponse>("/api/dashboard/summary", {
      params: { date_start: dateStart, date_end: dateEnd },
    });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Falha ao buscar dados do dashboard.";
      throw new Error(message);
    }
    throw error;
  }
}

export default api;
