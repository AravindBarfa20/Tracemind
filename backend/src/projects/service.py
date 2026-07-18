import re
import uuid
from typing import List
from src.core.exceptions import ConflictException, NotFoundException
from src.organizations.repository import OrganizationRepository
from src.projects.repository import ProjectRepository
from src.projects.schemas import ProjectCreate, ProjectResponse, ProjectUpdate

class ProjectService:
    """Manages workspace projects within organizations."""

    def __init__(self, repository: ProjectRepository, org_repository: OrganizationRepository):
        self.repository = repository
        self.org_repository = org_repository

    def _generate_slug(self, name: str) -> str:
        """Converts a name string into an URL-friendly alphanumeric slug."""
        slug = name.lower()
        slug = re.sub(r"[\s_]+", "-", slug)
        slug = re.sub(r"[^\w\-]", "", slug)
        slug = re.sub(r"-+", "-", slug)
        return slug.strip("-")

    async def create_project(self, data: ProjectCreate) -> ProjectResponse:
        """Creates a new project inside the designated organization."""
        # Ensure target organization exists
        org = await self.org_repository.get_by_id(data.organization_id)
        if not org:
            raise NotFoundException(f"Organization '{data.organization_id}' not found")

        base_slug = self._generate_slug(data.name)
        slug = base_slug
        
        # Check uniqueness *within* organization context
        counter = 1
        while await self.repository.get_by_slug(data.organization_id, slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        project_dict = {
            "name": data.name,
            "slug": slug,
            "organization_id": data.organization_id,
        }
        
        project = await self.repository.create(project_dict)
        return ProjectResponse.model_validate(project)

    async def get_project(self, org_id: uuid.UUID, slug: str) -> ProjectResponse:
        """Retrieves a project by organization ID and slug."""
        project = await self.repository.get_by_slug(org_id, slug)
        if not project:
            raise NotFoundException(f"Project '{slug}' not found in this organization")
        return ProjectResponse.model_validate(project)

    async def update_project(
        self, org_id: uuid.UUID, slug: str, data: ProjectUpdate
    ) -> ProjectResponse:
        """Updates project profile settings."""
        project = await self.repository.get_by_slug(org_id, slug)
        if not project:
            raise NotFoundException(f"Project '{slug}' not found in this organization")

        update_dict = {}
        if data.name is not None:
            update_dict["name"] = data.name

        updated = await self.repository.update(project.id, update_dict)
        return ProjectResponse.model_validate(updated)

    async def list_projects(self, org_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[ProjectResponse]:
        """Lists all projects mapped to an organization."""
        projects = await self.repository.list_by_org(org_id, skip, limit)
        return [ProjectResponse.model_validate(p) for p in projects]
