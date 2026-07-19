from enum import Enum
from app.models.tenant_membership import MembershipRole

class Permission(str, Enum):
    # Tenant / Organization level
    MANAGE_ORGANIZATION = "MANAGE_ORGANIZATION"
    MANAGE_MEMBERS = "MANAGE_MEMBERS"
    
    # Domain specific
    MANAGE_USERS = "MANAGE_USERS"
    MANAGE_TICKETS = "MANAGE_TICKETS"
    VIEW_TICKETS = "VIEW_TICKETS"
    
    MANAGE_DOCUMENTS = "MANAGE_DOCUMENTS"
    VIEW_DOCUMENTS = "VIEW_DOCUMENTS"
    
    MANAGE_KNOWLEDGE = "MANAGE_KNOWLEDGE"
    
    VIEW_ANALYTICS = "VIEW_ANALYTICS"


ROLE_PERMISSIONS = {
    MembershipRole.OWNER: {
        Permission.MANAGE_ORGANIZATION,
        Permission.MANAGE_MEMBERS,
        Permission.MANAGE_USERS,
        Permission.MANAGE_TICKETS,
        Permission.VIEW_TICKETS,
        Permission.MANAGE_DOCUMENTS,
        Permission.VIEW_DOCUMENTS,
        Permission.MANAGE_KNOWLEDGE,
        Permission.VIEW_ANALYTICS,
    },
    MembershipRole.ADMIN: {
        Permission.MANAGE_USERS,
        Permission.MANAGE_TICKETS,
        Permission.VIEW_TICKETS,
        Permission.MANAGE_DOCUMENTS,
        Permission.VIEW_DOCUMENTS,
        Permission.MANAGE_KNOWLEDGE,
        Permission.VIEW_ANALYTICS,
    },
    MembershipRole.SUPPORT_AGENT: {
        Permission.MANAGE_TICKETS,
        Permission.VIEW_TICKETS,
        Permission.VIEW_DOCUMENTS,
    },
    MembershipRole.KNOWLEDGE_MANAGER: {
        Permission.VIEW_TICKETS,
        Permission.MANAGE_DOCUMENTS,
        Permission.VIEW_DOCUMENTS,
        Permission.MANAGE_KNOWLEDGE,
    },
    MembershipRole.VIEWER: {
        Permission.VIEW_TICKETS,
        Permission.VIEW_DOCUMENTS,
    }
}

def has_permission(role: MembershipRole | str, permission: Permission) -> bool:
    if isinstance(role, str):
        try:
            role = MembershipRole(role)
        except ValueError:
            return False
            
    permissions = ROLE_PERMISSIONS.get(role, set())
    return permission in permissions
