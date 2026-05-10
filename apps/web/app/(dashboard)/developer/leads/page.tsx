"use client"

import { useState } from "react"
import { 
  Search, 
  Filter, 
  MoreHorizontal,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  Building2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PortalPendingApiBanner } from "@/components/dashboard/portal-banner"

const mockLeads = [
  {
    id: "1",
    name: "Chioma Eze",
    email: "chioma.eze@email.com",
    phone: "+234 801 234 5678",
    project: "Lekki Gardens Estate",
    unitType: "3 Bed Terrace",
    budget: "₦55M - ₦70M",
    status: "new",
    source: "website",
    message: "I'm interested in the 3-bedroom terrace units. Can I schedule a site visit this weekend?",
    createdAt: "2 hours ago",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    id: "2",
    name: "Emmanuel Adeyemi",
    email: "emmanuel.a@email.com",
    phone: "+234 802 345 6789",
    project: "Victoria Courts",
    unitType: "2 Bed Apartment",
    budget: "₦85M - ₦100M",
    status: "contacted",
    source: "whatsapp",
    message: "Looking for investment property in VI. What's the expected ROI?",
    createdAt: "5 hours ago",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    id: "3",
    name: "Ngozi Okafor",
    email: "ngozi.okafor@email.com",
    phone: "+234 803 456 7890",
    project: "Lekki Gardens Estate",
    unitType: "4 Bed Detached",
    budget: "₦100M - ₦130M",
    status: "touring",
    source: "referral",
    message: "My family is relocating from Abuja. We need a spacious family home.",
    createdAt: "1 day ago",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
  {
    id: "4",
    name: "Oluwaseun Bakare",
    email: "seun.bakare@email.com",
    phone: "+234 804 567 8901",
    project: "Ajah Paradise Homes",
    unitType: "2 Bed Semi-Detached",
    budget: "₦30M - ₦40M",
    status: "negotiating",
    source: "website",
    message: "What's your payment plan for the 2-bedroom units? I can make a 30% down payment.",
    createdAt: "2 days ago",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  },
  {
    id: "5",
    name: "Adaeze Nwosu",
    email: "ada.nwosu@email.com",
    phone: "+234 805 678 9012",
    project: "Victoria Courts",
    unitType: "Penthouse",
    budget: "₦200M+",
    status: "closed",
    source: "agent",
    message: "Looking for a luxury penthouse with harbor views.",
    createdAt: "3 days ago",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  },
  {
    id: "6",
    name: "Chukwudi Eze",
    email: "chukwudi.e@email.com",
    phone: "+234 806 789 0123",
    project: "Lekki Gardens Estate",
    unitType: "3 Bed Terrace",
    budget: "₦50M - ₦60M",
    status: "lost",
    source: "website",
    message: "Interested in your Lekki project. Please send brochure.",
    createdAt: "5 days ago",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  },
]

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-800", icon: Clock },
  contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-800", icon: Phone },
  touring: { label: "Site Visit", color: "bg-purple-100 text-purple-800", icon: Calendar },
  negotiating: { label: "Negotiating", color: "bg-orange-100 text-orange-800", icon: MessageSquare },
  closed: { label: "Closed Won", color: "bg-green-100 text-green-800", icon: CheckCircle },
  lost: { label: "Lost", color: "bg-gray-100 text-gray-800", icon: XCircle },
}

const stats = [
  { label: "New Leads", value: 12, change: "+3 today" },
  { label: "In Progress", value: 24, change: "8 tours scheduled" },
  { label: "Closed This Month", value: 8, change: "₦480M value" },
  { label: "Conversion Rate", value: "18%", change: "+2% from last month" },
]

export default function DeveloperLeadsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")

  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.project.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    const matchesProject = projectFilter === "all" || lead.project === projectFilter
    return matchesSearch && matchesStatus && matchesProject
  })

  const projects = [...new Set(mockLeads.map(l => l.project))]

  return (
    <div className="space-y-6">
      <PortalPendingApiBanner
        title="Developer leads use sample data"
        description="Once developer-scoped inquiries land, this page will pull from the same /v1/inquiries pipeline as the agent inbox."
      />

      <div>
        <h1 className="text-2xl font-bold">Lead Management</h1>
        <p className="text-muted-foreground">Track and manage buyer inquiries across all projects</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Building2 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project} value={project}>{project}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Lead</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">Project</th>
                  <th className="text-left p-4 font-medium hidden lg:table-cell">Unit Interest</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium hidden sm:table-cell">Date</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const status = statusConfig[lead.status]
                  const StatusIcon = status.icon
                  return (
                    <tr key={lead.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={lead.avatar} alt={lead.name} />
                            <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <p className="font-medium">{lead.project}</p>
                        <p className="text-sm text-muted-foreground">{lead.source}</p>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <p>{lead.unitType}</p>
                        <p className="text-sm text-muted-foreground">{lead.budget}</p>
                      </td>
                      <td className="p-4">
                        <Badge className={status.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">
                        {lead.createdAt}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Phone className="mr-2 h-4 w-4" />
                              Call
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Calendar className="mr-2 h-4 w-4" />
                              Schedule Tour
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Update Status</DropdownMenuItem>
                            <DropdownMenuItem>Assign to Team</DropdownMenuItem>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No leads found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
