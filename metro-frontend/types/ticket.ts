export interface Ticket {
    ticket_id: number;
    user_id: number;
    route_id: number;
    fare: number;
    booking_date: string;
    user_name?: string;
    route_name?: string;
}
