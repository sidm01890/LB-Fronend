import axios from "axios";
import {
  baseURL,
  ssoBaseURL,
  sso,
  reconcii,
  reconciiBaseURL,
  reconciiAdminBaseURL,
  activityURL,
  nodePasswordUrls,
  reconciliationNodeURL,
} from "../ServiceRequest/APIEndPoints";
const instance = axios.create({
  baseURL: baseURL,
  responseType: "json",
  timeout: 60000, // Default timeout (can be overridden per request)
  headers: {
    langId: 1,
    Accept: "application/json",
  },
});

export const handleError = ({ message, data, status }) => {
  return Promise.reject({ message, data, status });
};

// Intercept request to set dynamic baseURL
instance.interceptors.request.use((config) => {
  // If a specific baseURL is passed, use it; otherwise, default to the instance's baseURL
  if (config?.url?.includes(sso)) {
    config.baseURL = ssoBaseURL;
  }
  // Route setup and report endpoints to backend API (port 8034)
  // These endpoints have been moved from uploader service to backend service
  // Now using /api/setup/* and /api/reports/* instead of /api/uploader/setup/* and /api/uploader/reports/*
  if (
    config?.url?.includes("/api/setup/") ||
    config?.url?.includes("/api/reports/") ||
    config?.url?.includes("/api/uploader/datasource")
  ) {
    config.baseURL = baseURL; // Use backend baseURL (port 8034)
  }
  // Route upload endpoints to uploader service (port 8010)
  else if (
    config?.url?.includes("/api/upload") ||
    config?.url?.includes("/api/upload-chunk") ||
    config?.url?.includes("/api/upload-finalize") ||
    config?.url?.includes("/devyani-service/api/") ||
    (config?.url?.includes(reconcii) &&
      !config?.url?.includes("/api/uploader/datasource") &&
      !config?.url?.includes("/api/setup/") &&
      !config?.url?.includes("/api/reports/"))
  ) {
    config.baseURL = reconciiBaseURL; // Use uploader baseURL (port 8010)
  }
  if (config?.url?.includes(activityURL)) {
    config.baseURL = reconciiAdminBaseURL;
  }
  if (config?.url?.includes(nodePasswordUrls)) {
    config.baseURL = reconciiAdminBaseURL;
  }
  if (config?.url?.includes(reconciliationNodeURL)) {
    config.baseURL = reconciiAdminBaseURL;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  ({ message, response: { data, status } }) => {
    return handleError({ message, data, status });
  }
);

export default instance;
