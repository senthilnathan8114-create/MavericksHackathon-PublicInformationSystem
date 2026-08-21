from fastapi import APIRouter

from app.modules.datasets.router import router as datasets_router
from app.modules.intelligence.router import router as intelligence_router
from app.modules.reports.router import router as reports_router
from app.modules.reviews.router import router as reviews_router
from app.modules.rules.router import router as rules_router
from app.modules.surveys.router import router as surveys_router
from app.modules.validations.router import router as validations_router

api_router = APIRouter()
api_router.include_router(surveys_router, prefix="/surveys", tags=["surveys"])
api_router.include_router(datasets_router, prefix="/datasets", tags=["datasets"])
api_router.include_router(rules_router, prefix="/rules", tags=["rules"])
api_router.include_router(validations_router, prefix="/validations", tags=["validations"])
api_router.include_router(reviews_router, prefix="/reviews", tags=["reviews"])
api_router.include_router(reports_router, prefix="/reports", tags=["reports"])
api_router.include_router(intelligence_router, prefix="/intelligence", tags=["intelligence"])
