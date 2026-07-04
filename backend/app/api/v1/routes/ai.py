from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.ai import AIService

router = APIRouter(tags=["AI Assistant"])

@router.post("/ai/chat", response_model=AIChatResponse, status_code=status.HTTP_200_OK)
def chat_with_assistant(
    payload: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ai_service = AIService(db)
    response_text = ai_service.get_chat_response(current_user, payload.message)
    return AIChatResponse(response=response_text)
