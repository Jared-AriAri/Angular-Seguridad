export type TicketStatus =
  | "pendiente"
  | "en_progreso"
  | "revision"
  | "finalizado"
  | "bloqueado"
  | "pending"
  | "in_progress"
  | "review"
  | "completed"
  | "blocked";

export type TicketPriority =
  | "alta"
  | "media"
  | "baja"
  | "highest"
  | "high"
  | "medium_high"
  | "medium"
  | "medium_low"
  | "low"
  | "lowest";

export interface TicketComment {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface TicketHistoryItem {
  id: string;
  action: string;
  user: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;

  status: TicketStatus;
  priority: TicketPriority;

  assignedTo: string | null;

  createdBy: string;

  createdAt: string;
  dueDate: string | null;

  groupId: string;

  comments: TicketComment[];
  history: TicketHistoryItem[];
}