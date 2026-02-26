import api from "./api";

// searchLite accepts either a string query or an object of params
export function searchLite(queryOrParams) {
  let params = {};
  if (!queryOrParams) params = {};
  else if (typeof queryOrParams === "string") params = { query: queryOrParams };
  else params = queryOrParams;
  return api.get("/lite/search", { params });
}

export function bookLite(payload) {
  return api.post("/lite/book", payload);
}
