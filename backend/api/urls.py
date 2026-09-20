from django.urls import path
from api import views
from api import admin_auth_views
from api import admin_views

urlpatterns = [
    # Admin Auth & Dynamic Controllers
    path('admin/auth/login/', admin_views.AdminLoginView.as_view(), name='admin-auth-login'),
    path('admin/auth/login', admin_views.AdminLoginView.as_view(), name='admin-auth-login-noslash'),
    path('admin/auth/register/', admin_auth_views.admin_register),
    path('admin/auth/reset-password/', admin_auth_views.admin_reset_password),
    path('admin/stats/', admin_views.AdminStatsView.as_view(), name='admin-stats'),
    path('admin/stats', admin_views.AdminStatsView.as_view(), name='admin-stats-noslash'),
    path('admin/users/', admin_views.AdminUserManagementView.as_view(), name='admin-users'),
    path('admin/users', admin_views.AdminUserManagementView.as_view(), name='admin-users-noslash'),
    path('admin/users/<str:user_id>/action/', admin_views.AdminUserActionView.as_view(), name='admin-user-action'),
    path('admin/users/<str:user_id>/action', admin_views.AdminUserActionView.as_view(), name='admin-user-action-noslash'),
    path('admin/users/<str:user_id>/', admin_views.AdminUserActionView.as_view(), name='admin-user-delete'),
    path('admin/users/<str:user_id>', admin_views.AdminUserActionView.as_view(), name='admin-user-delete-noslash'),
    path('admin/overrides/', admin_views.AdminOverridesView.as_view(), name='admin-overrides'),
    path('admin/overrides', admin_views.AdminOverridesView.as_view(), name='admin-overrides-noslash'),

    # 14.1 Auth
    path('auth/login', views.login),
    path('auth/register', views.register),
    path('auth/reset-password', views.reset_password),
    path('reset-password/', views.reset_password),

    # 14.2 Profile
    path('profile', views.profile),

    # 14.3 Resume
    path('resume', views.get_resume),
    path('resume/upload', views.upload_resume),

    # 14.4 Skills
    path('skills', views.skills),
    path('skills/<str:skill_id>', views.remove_skill),

    # 14.5 Opportunities & Applications
    path('opportunities', views.get_opportunities),
    path('opportunities/recommendations', views.get_recommendations),
    path('applications', views.applications),
    path('applications/<str:app_id>', views.delete_application),
    path('applications/<str:app_id>/status', views.update_application_status),

    # 14.6 AI & Readiness
    path('readiness', views.get_readiness),

    # Notifications
    path('notifications', views.get_notifications),
    path('notifications/<str:notif_id>/read', views.mark_notification_read),

    # 14.8 Student Certificates (read-only, faculty-issued)
    path('certificates/my', views.get_my_certificates),
]
