"""Panel registration for Receptenboek integration."""
import logging
import os
from homeassistant.core import HomeAssistant
from homeassistant.components import frontend
from homeassistant.components.http import HomeAssistantView
from aiohttp import web
from aiohttp.web_request import Request
from aiohttp.web_response import Response

_LOGGER = logging.getLogger(__name__)

DOMAIN = "receptenboek"

class ReceptenboekView(HomeAssistantView):
    """View for Receptenboek frontend."""
    
    url = "/api/receptenboek/{path:.*}"
    name = "api:receptenboek"
    requires_auth = False

    def __init__(self, hass: HomeAssistant):
        """Initialize the view."""
        self.hass = hass

    async def get(self, request: Request, path: str) -> Response:
        """Handle GET requests."""
        if path == "":
            path = "index.html"
            
        # Serve frontend files
        if path in ["index.html", "style.css", "script.js"]:
            file_path = os.path.join(
                os.path.dirname(__file__), "frontend", path
            )
            try:
                with open(file_path, "r", encoding="utf-8") as file:
                    content = file.read()
                    
                content_type = "text/html"
                if path.endswith(".css"):
                    content_type = "text/css"
                elif path.endswith(".js"):
                    content_type = "application/javascript"
                    
                return Response(text=content, content_type=content_type)
            except FileNotFoundError:
                return Response(status=404)
        
        # API endpoints
        data_store = self.hass.data[DOMAIN]["data_store"]
        
        if path == "api/recipes":
            recipes = await data_store.get_recipes()
            return web.json_response(recipes)
        elif path == "api/categories":
            categories = await data_store.get_categories()
            return web.json_response(categories)
            
        return Response(status=404)

    async def post(self, request: Request, path: str) -> Response:
        """Handle POST requests."""
        data_store = self.hass.data[DOMAIN]["data_store"]
        
        if path == "api/recipes":
            recipe_data = await request.json()
            recipe_id = await data_store.add_recipe(recipe_data)
            return web.json_response({"id": recipe_id})
        elif path == "api/categories":
            category_data = await request.json()
            category_id = await data_store.add_category(category_data)
            return web.json_response({"id": category_id})
            
        return Response(status=404)

    async def put(self, request: Request, path: str) -> Response:
        """Handle PUT requests."""
        data_store = self.hass.data[DOMAIN]["data_store"]
        
        if path.startswith("api/recipes/"):
            recipe_id = path.split("/")[-1]
            recipe_data = await request.json()
            await data_store.update_recipe(recipe_id, recipe_data)
            return web.json_response({"success": True})
            
        return Response(status=404)

    async def delete(self, request: Request, path: str) -> Response:
        """Handle DELETE requests."""
        data_store = self.hass.data[DOMAIN]["data_store"]
        
        if path.startswith("api/recipes/"):
            recipe_id = path.split("/")[-1]
            await data_store.delete_recipe(recipe_id)
            return web.json_response({"success": True})
            
        return Response(status=404)

async def async_register_panel(hass: HomeAssistant) -> None:
    """Register the Receptenboek panel."""
    # Register the view
    view = ReceptenboekView(hass)
    hass.http.register_view(view)
    
    # Register the panel as iframe but with proper authentication
    frontend.async_register_built_in_panel(
        hass,
        "iframe",
        "Mijn Receptenboek",
        "mdi:book-open-variant",
        "receptenboek",
        {"url": "/api/receptenboek/"},
        require_admin=False,
    )
    
    _LOGGER.info("Receptenboek panel registered")
