export const normalizeRole = (role = "student") => {
  const value = String(role || "student")
    .trim()
    .toLowerCase();

  if (
    [
      "coordinator",
      "admin",
      "faculty coordinator",
      "faculty_coordinator",
    ].includes(value)
  ) {
    return "coordinator";
  }

  if (["student", "member", "learner"].includes(value)) {
    return "student";
  }

  return value === "coordinator" ? "coordinator" : "student";
};

export const isUniversityEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.com$/i.test(String(email).trim());
export const isCoordinatorRole = (role = "student") =>
  normalizeRole(role) === "coordinator";
export const isAllowedRole = (role = "student") =>
  ["student", "coordinator"].includes(normalizeRole(role));

export default {
  normalizeRole,
  isUniversityEmail,
  isCoordinatorRole,
  isAllowedRole,
};
