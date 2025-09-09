"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("../registry");
const tasks_1 = require("@/src/gee/tasks");
(0, registry_1.register)({
    name: 'get_export_task_status',
    description: 'Poll status of an export task',
    input: registry_1.z.object({ taskId: registry_1.z.string() }),
    output: registry_1.z.object({ state: registry_1.z.string().nullable(), progress: registry_1.z.number().nullable(), errorMessage: registry_1.z.string().nullable() }),
    handler: async ({ taskId }) => {
        const s = (0, tasks_1.getTaskStatus)(taskId);
        return { state: s.state ?? null, progress: s.progress ?? null, errorMessage: s.errorMessage ?? null };
    },
});
