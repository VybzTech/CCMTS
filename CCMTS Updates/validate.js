/**
 * Small field-validation helpers shared by the controllers.
 *
 * These exist because of UAT AUTH-004/005/006 and ADM-004: every
 * malformed or incomplete submission previously fell through to
 * Prisma/bcrypt and surfaced as a generic 500 "Internal Server Error",
 * which told the user nothing about which field was wrong.
 *
 * The contract is deliberately plain: return a 400 whose `message`
 * names the offending field in ordinary English, and an `errors` map
 * keyed by field name so a form can highlight inputs individually.
 * The Client reads `message` (see extractErrorMessage in
 * services/apiClient.ts) and can read `errors` when it wants per-field
 * placement.
 */

// Deliberately permissive - this catches "not an email address at all"
// (no @, no domain, spaces) without trying to out-parse RFC 5322.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmail = (value) =>
    typeof value === 'string' && EMAIL_PATTERN.test(value.trim());

const isBlank = (value) =>
    value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/**
 * Checks `body` against a list of field rules.
 *
 * @param {object} body   the request body
 * @param {Array<{ key: string, label: string, type?: 'email'|'password'|'text', minLength?: number }>} rules
 * @returns {{ errors: Record<string,string>, message: string｜null }}
 */
export const validateFields = (body = {}, rules = []) => {
    const errors = {};

    for (const rule of rules) {
        const { key, label, type = 'text', minLength } = rule;
        const value = body[key];

        if (isBlank(value)) {
            errors[key] = `${label} is required - the ${label.toLowerCase()} field is empty.`;
            continue;
        }

        if (type === 'email' && !isValidEmail(value)) {
            errors[key] =
                `That doesn't look like a valid ${label.toLowerCase()} - check for a missing "@" or domain.`;
            continue;
        }

        if (minLength && String(value).length < minLength) {
            errors[key] = `${label} must be at least ${minLength} characters.`;
        }
    }

    const fields = Object.keys(errors);
    if (fields.length === 0) {
        return { errors, message: null };
    }

    // One offending field reads better as its own sentence; several read
    // better as a list, so the toast isn't three sentences long.
    const message =
        fields.length === 1
            ? errors[fields[0]]
            : `Please check these fields: ${fields.map((f) => rules.find((r) => r.key === f).label).join(', ')}.`;

    return { errors, message };
};

/** Sends the 400 for a failed validateFields() result. */
export const sendValidationError = (res, { errors, message }) =>
    res.status(400).json({ message, errors });
