export function maskCnpj(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '').slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function unmaskCnpj(maskedValue: string): string {
  return maskedValue.replace(/\D/g, '');
}
