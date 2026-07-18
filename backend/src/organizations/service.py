import re
import uuid
from typing import List
from src.core.exceptions import ConflictException, NotFoundException
from src.organizations.repository import OrganizationRepository
from src.organizations.schemas import OrganizationCreate, OrganizationResponse, OrganizationUpdate

class OrganizationService:
    """Orchestrates tenant registration and profile operations."""

    def __init__(self, repository: OrganizationRepository):
        self.repository = repository

    def _generate_slug(self, name: str) -> str:
        """Converts a name string into an URL-friendly alphanumeric slug."""
        # Lowercase, replace spaces/underscores with hyphens, remove non-alphanumeric/non-hyphen characters
        slug = name.lower()
        slug = re.sub(r"[\s_]+", "-", slug)
        slug = re.sub(r"[^\w\-]", "", slug)
        # Remove consecutive hyphens
        slug = re.sub(r"-+", "-", slug)
        return slug.strip("-")

    async def create_organization(
        self, data: OrganizationCreate, owner_id: uuid.UUID
    ) -> OrganizationResponse:
        """Creates a new organization, ensuring slug uniqueness."""
        base_slug = self._generate_slug(data.name)
        slug = base_slug
        
        # Check uniqueness, append increments if collision occurs
        counter = 1
        while await self.repository.get_by_slug(slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        org_dict = {
            "name": data.name,
            "slug": slug,
            "owner_id": owner_id,
        }
        
        org = await self.repository.create(org_dict)
        return OrganizationResponse.model_validate(org)

    async def get_organization(self, slug: str) -> OrganizationResponse:
        """Retrieves an organization by its slug."""
        org = await self.repository.get_by_slug(slug)
        if not org:
            raise NotFoundException(f"Organization '{slug}' not found")
        return OrganizationResponse.model_validate(org)

    async def update_organization(
        self, slug: str, data: OrganizationUpdate
    ) -> OrganizationResponse:
        """Updates organization settings."""
        org = await self.repository.get_by_slug(slug)
        if not org:
            raise NotFoundException(f"Organization '{slug}' not found")

        update_dict = {}
        if data.name is not None:
            update_dict["name"] = data.name
            
        updated = await self.repository.update(org.id, update_dict)
        return OrganizationResponse.model_validate(updated)

    async def list_organizations(self, skip: int = 0, limit: int = 100) -> List[OrganizationResponse]:
        """Lists all tenant organizations."""
        orgs = await self.repository.list_all(skip, limit)
        return [OrganizationResponse.model_validate(o) for o in orgs]
