import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchSuperAdminSection } from "../api/superAdminApi.js";

export const fetchSuperAdminSectionData = createAsyncThunk(
  "superAdmin/fetchSection",
  (section, { signal }) => fetchSuperAdminSection(section, signal),
);
