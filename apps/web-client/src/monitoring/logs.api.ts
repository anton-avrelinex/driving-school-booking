import type {
  LogSearchFilters,
  LogSearchResultDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export async function searchLogs(
  filters: LogSearchFilters,
): Promise<LogSearchResultDto> {
  const { data } = await api.get<LogSearchResultDto>(
    "/monitoring/logs/search",
    { params: filters },
  );
  return data;
}
