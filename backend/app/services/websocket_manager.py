from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    """
    Manages active WebSocket connections.

    Connections are grouped by organization so that
    one organization's live attendance events are not
    broadcast to another organization.
    """

    def __init__(self):
        self.connections: dict[str, list[WebSocket]] = {}

    async def connect(
        self,
        organization_id: str,
        websocket: WebSocket,
    ):
        await websocket.accept()

        self.connections.setdefault(
            organization_id,
            [],
        ).append(websocket)

    def disconnect(
        self,
        organization_id: str,
        websocket: WebSocket,
    ):
        connections = self.connections.get(
            organization_id,
            [],
        )

        if websocket in connections:
            connections.remove(websocket)

        if not connections:
            self.connections.pop(
                organization_id,
                None,
            )

    async def send_personal(
        self,
        websocket: WebSocket,
        data: dict[str, Any],
    ):
        await websocket.send_json(data)

    async def broadcast(
        self,
        organization_id: str,
        data: dict[str, Any],
    ):
        connections = self.connections.get(
            organization_id,
            [],
        )

        disconnected = []

        for websocket in connections:
            try:
                await websocket.send_json(data)
            except Exception:
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect(
                organization_id,
                websocket,
            )

    def count(
        self,
        organization_id: str,
    ) -> int:
        return len(
            self.connections.get(
                organization_id,
                [],
            )
        )


manager = ConnectionManager()