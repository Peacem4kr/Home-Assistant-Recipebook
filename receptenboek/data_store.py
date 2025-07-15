"""Data storage for Receptenboek integration."""
import logging
import uuid
from typing import Dict, List, Any, Optional
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 1
STORAGE_KEY = "receptenboek_data"

class ReceptenboekDataStore:
    """Data store for recipes and categories."""
    
    def __init__(self, hass: HomeAssistant):
        """Initialize the data store."""
        self.hass = hass
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data = {
            "categories": {
                "hoofdgerecht": {"id": "hoofdgerecht", "name": "Hoofdgerecht"},
                "nagerecht": {"id": "nagerecht", "name": "Nagerecht"},
                "voorgerecht": {"id": "voorgerecht", "name": "Voorgerecht"},
                "bijgerecht": {"id": "bijgerecht", "name": "Bijgerecht"},
                "snack": {"id": "snack", "name": "Snack"},
                "drank": {"id": "drank", "name": "Drank"}
            },
            "recipes": {}
        }

    async def async_load(self) -> None:
        """Load data from storage."""
        try:
            stored_data = await self._store.async_load()
            if stored_data:
                self._data.update(stored_data)
        except Exception as e:
            _LOGGER.error("Failed to load data: %s", e)

    async def async_save(self) -> None:
        """Save data to storage."""
        try:
            await self._store.async_save(self._data)
        except Exception as e:
            _LOGGER.error("Failed to save data: %s", e)

    async def get_categories(self) -> List[Dict[str, Any]]:
        """Get all categories."""
        return list(self._data["categories"].values())

    async def get_recipes(self) -> List[Dict[str, Any]]:
        """Get all recipes."""
        return list(self._data["recipes"].values())

    async def get_recipes_by_category(self, category_id: str) -> List[Dict[str, Any]]:
        """Get recipes filtered by category."""
        return [
            recipe for recipe in self._data["recipes"].values()
            if recipe.get("category") == category_id
        ]

    async def get_recipe(self, recipe_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific recipe."""
        return self._data["recipes"].get(recipe_id)

    async def add_recipe(self, recipe_data: Dict[str, Any]) -> str:
        """Add a new recipe."""
        recipe_id = str(uuid.uuid4())
        recipe_data["id"] = recipe_id
        self._data["recipes"][recipe_id] = recipe_data
        await self.async_save()
        return recipe_id

    async def update_recipe(self, recipe_id: str, recipe_data: Dict[str, Any]) -> None:
        """Update an existing recipe."""
        if recipe_id in self._data["recipes"]:
            recipe_data["id"] = recipe_id
            self._data["recipes"][recipe_id] = recipe_data
            await self.async_save()

    async def delete_recipe(self, recipe_id: str) -> None:
        """Delete a recipe."""
        if recipe_id in self._data["recipes"]:
            del self._data["recipes"][recipe_id]
            await self.async_save()

    async def add_category(self, category_data: Dict[str, Any]) -> str:
        """Add a new category."""
        category_id = str(uuid.uuid4())
        category_data["id"] = category_id
        self._data["categories"][category_id] = category_data
        await self.async_save()
        return category_id
