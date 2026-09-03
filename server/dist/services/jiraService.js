"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create_issue = create_issue;
exports.get_issue = get_issue;
const VALID_PRIORITIES = ["Low", "Medium", "High", "Critical"];
async function create_issue(issue) {
    if (typeof issue.title !== "string" || issue.title.trim() === "") {
        throw new Error("Title must be a non-empty string");
    }
    if (typeof issue.description !== "string" || issue.description.trim() === "") {
        throw new Error("Description must be a non-empty string");
    }
    if (!VALID_PRIORITIES.includes(issue.priority)) {
        throw new Error(`Priority must be one of: ${VALID_PRIORITIES.join(", ")}`);
    }
    if (!Array.isArray(issue.labels) || !issue.labels.every((l) => typeof l === "string")) {
        throw new Error("Labels must be an array of strings");
    }
    if (typeof issue.assignee !== "string" || issue.assignee.trim() === "") {
        throw new Error("Assignee must be a non-empty string");
    }
    const issueToSend = {
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        labels: issue.labels,
        assignee: issue.assignee,
        status: issue.status || "To Do",
    };
    let response;
    try {
        response = await fetch("/api/jira/issues", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(issueToSend),
        });
    }
    catch (error) {
        throw new Error(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!response.ok) {
        throw new Error(`Failed to create issue: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
}
async function get_issue(id) {
    if (typeof id !== "string" || id.trim() === "") {
        throw new Error("ID must be a non-empty string");
    }
    let response;
    try {
        response = await fetch(`/api/jira/issues/${id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
    }
    catch (error) {
        throw new Error(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!response.ok) {
        throw new Error(`Failed to get issue: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
}
