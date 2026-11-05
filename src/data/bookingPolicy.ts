export const contactPattern = '[0-9]{2,3}(-| )?[0-9]{3,4}(-| )?[0-9]{4}'

export function getRecruitmentDeadline(departureDate: string) {
  const date = new Date(`${departureDate}T12:00:00`)
  if (!Number.isFinite(date.getTime())) return ''
  date.setDate(date.getDate() - 7)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
