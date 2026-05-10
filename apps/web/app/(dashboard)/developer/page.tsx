"use client"

import Link from "next/link"
import { 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Eye, 
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronRight,
  Home
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MarketListingsStat } from "@/components/developer/market-listings-stat"
import { PortalPendingApiBanner } from "@/components/dashboard/portal-banner"

const stats = [
  {
    title: "Units Sold",
    value: "156",
    change: "+24",
    trend: "up",
    icon: Home,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    title: "Active Inquiries",
    value: "48",
    change: "+12",
    trend: "up",
    icon: MessageSquare,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    title: "Revenue (YTD)",
    value: "₦2.4B",
    change: "+18%",
    trend: "up",
    icon: DollarSign,
    color: "text-accent",
    bgColor: "bg-accent/20",
  },
]

const recentProjects = [
  {
    id: "1",
    name: "Lekki Gardens Estate",
    status: "ONGOING",
    units: 48,
    sold: 32,
    views: 1240,
    inquiries: 18,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&h=150&fit=crop",
  },
  {
    id: "2",
    name: "Victoria Courts",
    status: "UPCOMING",
    units: 24,
    sold: 0,
    views: 890,
    inquiries: 42,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200&h=150&fit=crop",
  },
  {
    id: "3",
    name: "Ikoyi Towers",
    status: "COMPLETED",
    units: 36,
    sold: 36,
    views: 2100,
    inquiries: 0,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=150&fit=crop",
  },
]

const recentLeads = [
  {
    id: "1",
    name: "Chioma Eze",
    project: "Lekki Gardens Estate",
    type: "3 Bed Terrace",
    date: "2 hours ago",
    status: "new",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    id: "2",
    name: "Emmanuel Adeyemi",
    project: "Victoria Courts",
    type: "2 Bed Apartment",
    date: "5 hours ago",
    status: "contacted",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    id: "3",
    name: "Ngozi Okafor",
    project: "Lekki Gardens Estate",
    type: "4 Bed Detached",
    date: "1 day ago",
    status: "touring",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
]

const statusColors: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800",
  ONGOING: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  SOLD_OUT: "bg-purple-100 text-purple-800",
}

const leadStatusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  touring: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
}

export default function DeveloperDashboard() {
  return (
    <div className="space-y-8">
      <PortalPendingApiBanner
        title="Developer portal renders sample data"
        description="The marketplace listings count is live; the rest of the dashboard waits on the developer projects/leads API."
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your portfolio overview.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/developer/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MarketListingsStat />
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === "up" ? "text-green-600" : "text-red-600"
                }`}>
                  {stat.change}
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Your latest development projects</CardDescription>
              </div>
              <Link href="/developer/projects">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <Link 
                    key={project.id} 
                    href={`/developer/projects/${project.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="relative h-16 w-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={project.image}
                        alt={project.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{project.name}</h4>
                        <Badge className={statusColors[project.status]} variant="secondary">
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{project.sold}/{project.units} units sold</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {project.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {project.inquiries}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest buyer inquiries</CardDescription>
            </div>
            <Link href="/developer/leads">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={lead.avatar} alt={lead.name} />
                    <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{lead.name}</p>
                      <Badge className={leadStatusColors[lead.status]} variant="secondary">
                        {lead.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {lead.type} • {lead.project}
                    </p>
                    <p className="text-xs text-muted-foreground">{lead.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/developer/projects/new">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Plus className="h-6 w-6" />
                <span>Add New Project</span>
              </Button>
            </Link>
            <Link href="/developer/bulk-upload">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Building2 className="h-6 w-6" />
                <span>Bulk Upload Units</span>
              </Button>
            </Link>
            <Link href="/developer/leads">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>View All Leads</span>
              </Button>
            </Link>
            <Link href="/developer/analytics">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>View Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
