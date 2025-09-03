"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteSchema = exports.PresignPartsSchema = exports.CreateSessionSchema = void 0;
const zod_1 = require("zod");
exports.CreateSessionSchema = zod_1.z.object({
    filename: zod_1.z.string(),
    size: zod_1.z.number().int().nonnegative(),
    contentType: zod_1.z.string().default('application/octet-stream'),
    desiredPartSize: zod_1.z.number().int().positive().optional()
});
exports.PresignPartsSchema = zod_1.z.object({
    partNumbers: zod_1.z.array(zod_1.z.number().int().positive()).nonempty()
});
exports.CompleteSchema = zod_1.z.object({
    parts: zod_1.z.array(zod_1.z.object({
        ETag: zod_1.z.string(),
        PartNumber: zod_1.z.number().int().positive(),
        size: zod_1.z.number().int().positive()
    })).nonempty()
});
