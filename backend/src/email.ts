export const CORPORATE_EMAIL_MESSAGE =
  "Use seu e-mail corporativo.";

const corporateEmailDomains = [
  "astroturviagens.com",
  "grupoastrotur.com.br",
  "transastro.com.br",
];

export function isCorporateEmail(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return corporateEmailDomains.some((domain) => normalizedEmail.endsWith(`@${domain}`));
}
