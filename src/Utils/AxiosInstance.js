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
  // Exclude /api/uploader/datasource from uploader service routing - it's on backend API
  // Route /devyani-service/api/* to uploader service
  if (config?.url?.includes('/devyani-service/api/') || (config?.url?.includes(reconcii) && !config?.url?.includes('/api/uploader/datasource'))) {
    config.baseURL = reconciiBaseURL;
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
