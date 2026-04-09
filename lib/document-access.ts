type DocForAccess = {
  userId: string
  linkedOrderId: string | null
  order: { customerId: string } | null
}

export function canAccessDocument(
  doc: DocForAccess,
  userId: string,
  customerId: string | null,
  admin: boolean
): boolean {
  if (admin) return true
  if (doc.userId === userId) return true
  if (customerId && doc.order?.customerId === customerId) return true
  return false
}

export function canAccessDocumentWithCustomer(
  doc: DocForAccess,
  userId: string,
  profile: { customerId: string | null },
  admin: boolean
): boolean {
  return canAccessDocument(doc, userId, profile.customerId, admin)
}
