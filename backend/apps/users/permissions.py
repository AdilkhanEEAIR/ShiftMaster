from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_manager_or_above


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        from apps.users.models import User
        return request.user.is_authenticated and request.user.role == User.Role.ADMIN


class IsOwnerOrManagerOrAdmin(BasePermission):
    """Allow owners full access; managers/admins can read."""

    def has_object_permission(self, request, view, obj):
        if request.user.is_manager_or_above:
            return True
        owner = getattr(obj, 'employee', getattr(obj, 'user', obj))
        return owner == request.user


class IsSelfOrManagerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_manager_or_above:
            return True
        return obj == request.user
