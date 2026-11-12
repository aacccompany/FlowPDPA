const SECTION_HEADING = /^(\d+)\\?\.\s+(.+)$/

export function normalizePolicyMarkdown(value: string): string {
  const repaired = value
    .replace(/\r\n?/g, '\n')
    .replace(/^(#{1,6}\s+\d+)\\\./gm, '$1.')
    .replace(/([^\n]):\s*-\s+/g, '$1:\n\n- ')
    .replace(/(?<=\S)-\s+(?=\S)/g, '\n- ')
  const lines = repaired.split('\n')
  const normalized: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()
    const looksLikeSection = /^\d+\\\.\s+/.test(trimmed)
      || (/^\*\*\d+\.\s+/.test(trimmed) && /\*\*$/.test(trimmed))
    const section = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '').match(SECTION_HEADING)

    if (looksLikeSection && section) {
      if (normalized.length && normalized.at(-1) !== '') normalized.push('')
      normalized.push(`## ${section[1]}. ${section[2].replace(/\*\*$/g, '').trim()}`, '')
      continue
    }

    normalized.push(line)
  }

  return normalized
    .join('\n')
    .replace(/^(#{1,6}\s+.+)\n(?=\S)/gm, '$1\n\n')
    .replace(/([^\n])\n(?=-\s)/g, '$1\n\n')
    .replace(/(^-\s.+)\n(?=[^-\n])/gm, '$1\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
