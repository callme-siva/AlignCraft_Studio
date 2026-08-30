"""Entry point to launch the AlignCraft Studio server."""
import uvicorn
from app.config import settings

if __name__ == "__main__":
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION} on http://{settings.HOST}:{settings.PORT}")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
