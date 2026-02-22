"""
In-memory user store. Single source of truth for all user state.
Session-based auth: session_id -> user_id.
"""

from typing import Optional
from models.user_models import User, new_id

_users: dict[str, User] = {}
_sessions: dict[str, str] = {}  # session_id -> user_id


def get_user_by_id(user_id: str) -> Optional[User]:
    return _users.get(user_id)


def get_user_by_name(name: str) -> Optional[User]:
    name_clean = (name or "").strip().lower()
    if not name_clean:
        return None
    for u in _users.values():
        if (u.name or "").strip().lower() == name_clean:
            return u
    return None


def save_user(user: User) -> User:
    _users[user.id] = user
    return user


def create_user(name: str, password: str = "") -> User:
    user = User(
        id=new_id(),
        name=(name or "").strip(),
        password_hash=password,  # mock: store as-is
        setup_done=False,
    )
    return save_user(user)


def create_session(user_id: str) -> str:
    session_id = new_id()
    _sessions[session_id] = user_id
    return session_id


def get_user_by_session(session_id: str) -> Optional[User]:
    if not session_id:
        return None
    user_id = _sessions.get(session_id)
    if not user_id:
        return None
    return _users.get(user_id)


def delete_session(session_id: str) -> None:
    _sessions.pop(session_id, None)
