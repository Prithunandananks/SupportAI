from typing import Dict
from app.models.ticket import TicketPriority

class SLARule:
    def __init__(self, first_response_hours: int, resolution_hours: int):
        self.first_response_hours = first_response_hours
        self.resolution_hours = resolution_hours

SLA_CONFIG: Dict[TicketPriority, SLARule] = {
    TicketPriority.URGENT: SLARule(first_response_hours=1, resolution_hours=8),
    TicketPriority.HIGH: SLARule(first_response_hours=4, resolution_hours=24),
    TicketPriority.MEDIUM: SLARule(first_response_hours=8, resolution_hours=48),
    TicketPriority.LOW: SLARule(first_response_hours=24, resolution_hours=72),
}

# Configurable threshold in hours for a ticket to be considered "Due Soon"
DUE_SOON_THRESHOLD_HOURS = 2
