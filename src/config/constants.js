export const ROLES = {
  ADMIN: 'admin',
  LIBRARIAN: 'librarian',
  MEMBER: 'member'
};

export const MEMBER_TYPES = {
  STUDENT: 'student',
  STAFF: 'staff'
};

export const LOAN_STATUS = {
  BORROWED: 'borrowed',
  RETURNED: 'returned',
  OVERDUE: 'overdue'
};

export const LOAN_RULES = {
  student: {
    durationDays: 14,
    maxBooks: 5,
    maxRenewals: 2
  },
  staff: {
    durationDays: 30,
    maxBooks: 10,
    maxRenewals: 3
  }
};
