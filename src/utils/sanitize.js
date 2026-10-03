export function sanitizeText(value, trim = true) {
  const text = String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .split('')
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('');
  return trim ? text.trim() : text;
}
