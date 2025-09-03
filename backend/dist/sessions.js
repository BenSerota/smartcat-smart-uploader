"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putSession = putSession;
exports.getSession = getSession;
exports.deleteSession = deleteSession;
const store = new Map();
function putSession(x) {
    store.set(x.id, x);
}
function getSession(id) {
    return store.get(id) || null;
}
function deleteSession(id) {
    store.delete(id);
}
