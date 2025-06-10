from django.contrib import admin # type: ignore
from django.urls import path, include # type: ignore
from salaire.views import MyTokenObtainPairView  # correction ici
from rest_framework_simplejwt.views import TokenRefreshView # type: ignore
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('salaire.urls')),

    # ✅ Vue personnalisée utilisée ici
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),

    # ✅ Rafraîchissement du token
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
# Servir les fichiers médias en mode DEBUG
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)