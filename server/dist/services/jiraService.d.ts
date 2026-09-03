import { JiraIssue } from "../types";
export declare function create_issue(issue: JiraIssue): Promise<JiraIssue>;
export declare function get_issue(id: string): Promise<JiraIssue>;
