export const MIN_PASSWORD_LENGTH = 12;

const CHARACTER_CLASSES = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];

export function validateNewPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): string | null {
  if (!currentPassword) {
    return "Introduz a password atual.";
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `A nova password tem de ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  const classes = CHARACTER_CLASSES.filter((pattern) => pattern.test(newPassword)).length;
  if (classes < 3) {
    return "Usa pelo menos três tipos de caracteres: minúsculas, maiúsculas, números ou símbolos.";
  }
  if (newPassword !== confirmPassword) {
    return "A confirmação da nova password não coincide.";
  }
  if (newPassword === currentPassword) {
    return "A nova password tem de ser diferente da atual.";
  }
  return null;
}
