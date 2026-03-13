export type TicketStatus = 'pendiente' | 'en_progreso' | 'revision' | 'finalizado';
export type TicketPriority = '最高' | '高' | '中高' | '中' | '中低' | '低' | '最低' | 'alta' | 'media' | 'baja'; // keep backwards compat

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
  assignedTo: string;
  createdAt: string;
  dueDate: string | null;
  groupId: string;
  comments: TicketComment[];
  history: TicketHistoryItem[];
}