from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..controllers.graph_controller import GraphController
from ..db.database import get_testdb

router = APIRouter(
    prefix="/api/graphs",
    tags=["graphs"],
    responses={404: {"description": "Not found"}},
)

@router.get("/{graph_id}", response_model=Dict[str, Any])
async def get_graph_by_id(
    graph_id: str,
    db: AsyncIOMotorDatabase = Depends(get_testdb)
):
    """
    Get graph data by specific ObjectId
    """
    controller = GraphController(db)
    return await controller.get_graph_by_id(graph_id)

@router.get("/", response_model=List[Dict[str, Any]])
async def get_all_graphs(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_testdb)
):
    """
    Get all graphs with pagination
    """
    controller = GraphController(db)
    return await controller.get_all_graphs(skip, limit)

# Special endpoint for the specific ObjectId mentioned in the requirements
@router.get("/specific", response_model=Dict[str, Any])
async def get_specific_graph(
    db: AsyncIOMotorDatabase = Depends(get_testdb)
):
    """
    Get the specific graph with ObjectId: 681f8e01efc025a0df256026
    """
    specific_id = "681f8e01efc025a0df256026"
    controller = GraphController(db)
    return await controller.get_graph_by_id(specific_id)
