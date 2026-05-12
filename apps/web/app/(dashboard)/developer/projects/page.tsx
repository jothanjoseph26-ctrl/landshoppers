"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  MessageSquare,
  MapPin,
  Building2,
  Edit,
  Trash2,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { PortalPendingApiBanner } from "@/components/dashboard/portal-banner"

const mockProjects = [
  {
    id: "1",
    name: "Lekki Gardens Estate",
    slug: "lekki-gardens-estate",
    location: "Lekki Phase 1, Lagos",
    status: "ONGOING",
    totalUnits: 48,
    soldUnits: 32,
    availableUnits: 16,
    priceRange: { min: 45000000, max: 120000000 },
    views: 1240,
    inquiries: 18,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    name: "Victoria Courts",
    slug: "victoria-courts",
    location: "Victoria Island, Lagos",
    status: "UPCOMING",
    totalUnits: 24,
    soldUnits: 0,
    availableUnits: 24,
    priceRange: { min: 85000000, max: 250000000 },
    views: 890,
    inquiries: 42,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
    createdAt: "2026-03-01",
  },
  {
    id: "3",
    name: "Ikoyi Towers",
    slug: "ikoyi-towers",
    location: "Ikoyi, Lagos",
    status: "COMPLETED",
    totalUnits: 36,
    soldUnits: 36,
    availableUnits: 0,
    priceRange: { min: 150000000, max: 450000000 },
    views: 2100,
    inquiries: 0,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
    createdAt: "2025-06-20",
  },
  {
    id: "4",
    name: "Ajah Paradise Homes",
    slug: "ajah-paradise-homes",
    location: "Ajah, Lagos",
    status: "ONGOING",
    totalUnits: 72,
    soldUnits: 45,
    availableUnits: 27,
    priceRange: { min: 25000000, max: 65000000 },
    views: 3200,
    inquiries: 56,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    createdAt: "2025-09-10",
  },
  {
    id: "5",
    name: "Banana Island Residences",
    slug: "banana-island-residences",
    location: "Banana Island, Lagos",
    status: "SOLD_OUT",
    totalUnits: 12,
    soldUnits: 12,
    availableUnits: 0,
    priceRange: { min: 500000000, max: 1500000000 },
    views: 1800,
    inquiries: 0,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    createdAt: "2025-02-28",
  },
]

const statusColors: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800",
  ONGOING: "bg-primary/10 text-primary",
  COMPLETED: "bg-gray-100 text-gray-800",
  SOLD_OUT: "bg-purple-100 text-purple-800",
}

function formatPrice(value: number): string {
  if (value >= 1000000000) {
    return `₦${(value / 1000000000).toFixed(1)}B`
  }
  return `₦${(value / 1000000).toFixed(0)}M`
}

export default function DeveloperProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <PortalPendingApiBanner
        title="Project management UI is using sample data"
        description="The /v1/developer/projects endpoints land in a future slice. Buyers can already browse public projects via the /projects routes."
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">Manage your development projects and units</p>
        </div>
        <Link href="/developer/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="ONGOING">Ongoing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const soldPercentage = (project.soldUnits / project.totalUnits) * 100
          return (
            <Card key={project.id} className="overflow-hidden group">
              <div className="relative h-48">
                <Image
                  src={project.image}
                  alt={project.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className={`absolute top-3 left-3 ${statusColors[project.status]}`}>
                  {project.status.replace("_", " ")}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute top-3 right-3 h-8 w-8"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/developer/projects/${project.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/developer/projects/${project.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Project
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/projects/${project.slug}`} target="_blank">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Public Page
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardContent className="p-4">
                <Link href={`/developer/projects/${project.id}`}>
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <MapPin className="h-3 w-3" />
                  {project.location}
                </div>

                <div className="space-y-3">
                  {/* Units Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Units Sold</span>
                      <span className="font-medium">{project.soldUnits}/{project.totalUnits}</span>
                    </div>
                    <Progress value={soldPercentage} className="h-2" />
                  </div>

                  {/* Price Range */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price Range</span>
                    <span className="font-medium">
                      {formatPrice(project.priceRange.min)} - {formatPrice(project.priceRange.max)}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 pt-2 border-t">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {project.views.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      {project.inquiries}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {project.availableUnits} available
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== "all" 
              ? "Try adjusting your search or filters" 
              : "Create your first project to get started"}
          </p>
          <Link href="/developer/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
