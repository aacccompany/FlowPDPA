import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export interface DBDCompany {
  juristicId: string;
  juristicName: string;
  juristicType: string;
  juristicStatus: string;
  juristicObjective: string;
  registeredCapital: string;
  address?: string;
  branchNumber?: string;
  businessFirstDate?: string;
  source?: "rd" | "dbd" | "rd+dbd";
}

export const companyRegistryApi = {
  lookup: (juristicId: string) =>
    apiRequest<DBDCompany>(API_ENDPOINTS.companyRegistry.byId(juristicId)),
};
