export function isFresh(doc, minutes) {
if (!doc) return false;
const ageMs = Date.now() - new Date(doc.createdAt).getTime();
return ageMs <= minutes * 60 * 1000;
}