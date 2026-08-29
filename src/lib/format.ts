export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export function accountTypeLabel(accountType: "current_student" | "prospective_student") {
  return accountType === "current_student" ? "University student" : "Prospective student";
}
