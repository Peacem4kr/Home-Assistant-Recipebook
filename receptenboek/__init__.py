"""Custom Home Assistant integration for managing Dutch recipe book."""
import logging
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.helpers.typing import ConfigType

from .panel import async_register_panel
from .data_store import ReceptenboekDataStore

_LOGGER = logging.getLogger(__name__)

DOMAIN = "receptenboek"

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the Receptenboek integration."""
    # Initialize data store
    data_store = ReceptenboekDataStore(hass)
    await data_store.async_load()
    
    # Store in hass.data for access from other components
    hass.data[DOMAIN] = {"data_store": data_store}
    
    # Register the panel
    await async_register_panel(hass)
    
    _LOGGER.info("Receptenboek integration initialized")
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the Receptenboek integration."""
    hass.data.pop(DOMAIN, None)
    return True
