import re
import time
import uuid
import httpx
from typing import List, Optional
from src.core.exceptions import ConflictException, NotFoundException
from src.projects.repository import ProjectRepository
from src.services_registry.repository import ServiceRepository
from src.services_registry.schemas import (
    ServiceCreate,
    ServiceListResponse,
    ServiceResponse,
    ServiceUpdate,
)

class ServiceRegistryService:
    """Manages lifecycle registrations for observed microservices."""

    def __init__(self, repository: ServiceRepository, project_repository: ProjectRepository):
        self.repository = repository
        self.project_repository = project_repository

    def _generate_slug(self, name: str) -> str:
        """Converts service name into URL-friendly alphanumeric slug."""
        slug = name.lower()
        slug = re.sub(r"[\s_]+", "-", slug)
        slug = re.sub(r"[^\w\-]", "", slug)
        slug = re.sub(r"-+", "-", slug)
        return slug.strip("-")

    async def register_service(self, data: ServiceCreate, owner_id: uuid.UUID) -> ServiceResponse:
        """Registers a service, resolving project & org scoping, and generating unique slugs."""
        project = await self.project_repository.get_by_id(data.project_id)
        if not project:
            raise NotFoundException(f"Target project '{data.project_id}' not found")

        base_slug = self._generate_slug(data.name)
        slug = base_slug
        
        # Check uniqueness within project scope
        counter = 1
        while await self.repository.get_by_slug(data.project_id, slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        service_dict = data.model_dump()
        service_dict.update({
            "slug": slug,
            "organization_id": project.organization_id,
            "owner_id": owner_id,
            "status": "active",
        })
        
        service = await self.repository.create(service_dict)
        return ServiceResponse.model_validate(service)

    async def get_service(self, project_id: uuid.UUID, slug: str) -> ServiceResponse:
        """Retrieves a single service by slug inside project scope."""
        service = await self.repository.get_by_slug(project_id, slug)
        if not service:
            raise NotFoundException(f"Service '{slug}' not found in this project")
        return ServiceResponse.model_validate(service)

    async def update_service(
        self, project_id: uuid.UUID, slug: str, data: ServiceUpdate
    ) -> ServiceResponse:
        """Applies updates to registered service parameters."""
        service = await self.repository.get_by_slug(project_id, slug)
        if not service:
            raise NotFoundException(f"Service '{slug}' not found in this project")

        update_data = data.model_dump(exclude_unset=True)
        updated = await self.repository.update(service.id, update_data)
        return ServiceResponse.model_validate(updated)

    async def deactivate_service(self, project_id: uuid.UUID, slug: str) -> ServiceResponse:
        """Soft-deletes a service by toggling status to 'inactive'."""
        return await self.update_service(
            project_id, slug, ServiceUpdate(status="inactive")
        )

    async def list_services(
        self,
        project_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        team: Optional[str] = None,
        environment: Optional[str] = None,
        search: Optional[str] = None,
    ) -> ServiceListResponse:
        """Retrieves paginated search results for services scoped to a project."""
        skip = (page - 1) * page_size
        items, total = await self.repository.list_services(
            project_id=project_id,
            skip=skip,
            limit=page_size,
            status=status,
            team=team,
            environment=environment,
            search=search,
        )
        
        responses = [ServiceResponse.model_validate(item) for item in items]
        return ServiceListResponse(
            items=responses,
            total=total,
            page=page,
            page_size=page_size,
        )

    async def check_health(self, project_id: uuid.UUID, slug: str) -> dict:
        """Sends an active HTTP GET request to check service status.

        Returns health details and latency.
        """
        service = await self.repository.get_by_slug(project_id, slug)
        if not service:
            raise NotFoundException(f"Service '{slug}' not found in this project")

        target_url = service.health_endpoint or service.base_url
        if not target_url:
            return {
                "status": "unknown",
                "error": "No health URL or base URL configured",
                "latency_ms": 0.0,
            }

        start_time = time.perf_counter()
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                response = await client.get(target_url)
                latency = (time.perf_counter() - start_time) * 1000.0
                
                status_str = "healthy" if response.status_code == 200 else "unhealthy"
                return {
                    "status": status_str,
                    "status_code": response.status_code,
                    "latency_ms": round(latency, 2),
                    "url": target_url,
                }
            except Exception as e:
                latency = (time.perf_counter() - start_time) * 1000.0
                return {
                    "status": "unhealthy",
                    "error": str(e),
                    "latency_ms": round(latency, 2),
                    "url": target_url,
                }
class ServiceRegistryService:
    """Manages lifecycle registrations for observed microservices."""

    def __init__(self, repository: ServiceRepository, project_repository: ProjectRepository):
        self.repository = repository
        self.project_repository = project_repository

    def _generate_slug(self, name: str) -> str:
        """Converts service name into URL-friendly alphanumeric slug."""
        slug = name.lower()
        slug = re.sub(r"[\s_]+", "-", slug)
        slug = re.sub(r"[^\w\-]", "", slug)
        slug = re.sub(r"-+", "-", slug)
        return slug.strip("-")

    async def register_service(self, data: ServiceCreate, owner_id: uuid.UUID) -> ServiceResponse:
        """Registers a service, resolving project & org scoping, and generating unique slugs."""
        project = await self.project_repository.get_by_id(data.project_id)
        if not project:
            raise NotFoundException(f"Target project '{data.project_id}' not found")

        base_slug = self._generate_slug(data.name)
        slug = base_slug
        
        # Check uniqueness within project scope
        counter = 1
        while await self.repository.get_by_slug(data.project_id, slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        service_dict = data.model_dump()
        service_dict.update({
            "slug": slug,
            "organization_id": project.organization_id,
            "owner_id": owner_id,
            "status": "active",
        })
        
        service = await self.repository.create(service_dict)
        return ServiceResponse.model_validate(service)

    async def get_service(self, project_id: uuid.UUID, slug: str) -> ServiceResponse:
        """Retrieves a single service by slug inside project scope."""
        service = await self.repository.get_by_slug(project_id, slug)
        if not service:
            raise NotFoundException(f"Service '{slug}' not found in this project")
        return ServiceResponse.model_validate(service)

    async def update_service(
        self, project_id: uuid.UUID, slug: str, data: ServiceUpdate
    ) -> ServiceResponse:
        """Applies updates to registered service parameters."""
        service = await self.repository.get_by_slug(project_id, slug)
        if not service:
            raise NotFoundException(f"Service '{slug}' not found in this project")

        update_data = data.model_dump(exclude_unset=True)
        updated = await self.repository.update(service.id, update_data)
        return ServiceResponse.model_validate(updated)

    async def deactivate_service(self, project_id: uuid.UUID, slug: str) -> ServiceResponse:
        """Soft-deletes a service by toggling status to 'inactive'."""
        return await self.update_service(
            project_id, slug, ServiceUpdate(status="inactive")
        )

    async def list_services(
        self,
        project_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        team: Optional[str] = None,
        environment: Optional[str] = None,
        search: Optional[str] = None,
    ) -> ServiceListResponse:
        """Retrieves paginated search results for services scoped to a project."""
        skip = (page - 1) * page_size
        items, total = await self.repository.list_services(
            project_id=project_id,
            skip=skip,
            limit=page_size,
            status=status,
            team=team,
            environment=environment,
            search=search,
        )
        
        responses = [ServiceResponse.model_validate(item) for item in items]
        return ServiceListResponse(
            items=responses,
            total=total,
            page=page,
            page_size=page_size,
        )

    async def check_health(self, project_id: uuid.UUID, slug: str) -> dict:
        """Sends an active HTTP GET request to check service status.

        Returns health details and latency.
        """
        service = await self.repository.get_by_slug(project_id, slug)
        if not service:
            raise NotFoundException(f"Service '{slug}' not found in this project")

        target_url = service.health_endpoint or service.base_url
        if not target_url:
            return {
                "status": "unknown",
                "error": "No health URL or base URL configured",
                "latency_ms": 0.0,
            }

        start_time = time.perf_counter()
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                response = await client.get(target_url)
                latency = (time.perf_counter() - start_time) * 1000.0
                
                status_str = "healthy" if response.status_code == 200 else "unhealthy"
                return {
                    "status": status_str,
                    "status_code": response.status_code,
                    "latency_ms": round(latency, 2),
                    "url": target_url,
                }
            except Exception as e:
                latency = (time.perf_counter() - start_time) * 1000.0
                return {
                    "status": "unhealthy",
                    "error": str(e),
                    "latency_ms": round(latency, 2),
                    "url": target_url,
                }
