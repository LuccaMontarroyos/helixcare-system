import { SearchResultItem } from "./search-result-item.dto";

export interface GlobalSearchResponse {
    patients: SearchResultItem[];
    doctors: SearchResultItem[];
    appointments: SearchResultItem[];
  }