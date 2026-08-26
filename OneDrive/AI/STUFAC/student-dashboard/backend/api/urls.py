from django.urls import path
from api import views

urlpatterns = [
    # 14.1 Auth
    path('auth/login', views.login),
    path('auth/register', views.register),

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

    # 14.6 AI & Readiness
    path('readiness', views.get_readiness),

    # Notifications
    path('notifications', views.get_notifications),
    path('notifications/<str:notif_id>/read', views.mark_notification_read),
]
