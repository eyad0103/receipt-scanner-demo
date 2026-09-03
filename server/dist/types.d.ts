export interface JiraIssue {
    id?: string;
    title: string;
    description: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    labels: string[];
    assignee: string;
    status?: string;
    created_at?: string;
}
