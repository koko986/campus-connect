import type { ImageProblem } from "@/lib/data";
import { localeTag, type Language, type Translate, type TranslationKey } from "@/lib/i18n";

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Month names and digit shapes both follow the reader's language. */
export function formatDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(localeTag(language), { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function accountTypeKey(
  accountType: "current_student" | "prospective_student",
): TranslationKey {
  return accountType === "current_student"
    ? "account.type.currentStudent"
    : "account.type.prospectiveStudent";
}

export function imageProblemMessage(t: Translate, problem: ImageProblem) {
  return problem.reason === "type"
    ? t("image.wrongType")
    : t("image.tooLarge", { megabytes: problem.megabytes });
}
