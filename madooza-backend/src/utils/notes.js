const MAX_NOTE_VALUE_LENGTH = 256;
const MAX_NOTES = 15;

function sanitiseValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.slice(0, MAX_NOTE_VALUE_LENGTH);
  }

  try {
    return JSON.stringify(value).slice(0, MAX_NOTE_VALUE_LENGTH);
  } catch (error) {
    return String(value).slice(0, MAX_NOTE_VALUE_LENGTH);
  }
}

function buildNotes(formType, payload = {}) {
  const notes = { formType };
  const entries = Object.entries(payload);

  for (const [key, rawValue] of entries) {
    if (Object.keys(notes).length >= MAX_NOTES) {
      break;
    }

    const safeKey = String(key).slice(0, 45) || 'field';
    notes[safeKey] = sanitiseValue(rawValue);
  }

  return notes;
}

module.exports = {
  buildNotes,
};
