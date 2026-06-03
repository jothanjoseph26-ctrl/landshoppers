# Private DNS namespace so ECS services can find each other by name
# inside the VPC without exposing anything publicly.
# AI service registers as:  ai.landshoppers.internal:8000
# API calls it via env var:  AI_SERVICE_URL=http://ai.landshoppers.internal:8000

resource "aws_service_discovery_private_dns_namespace" "main" {
  name = "landshoppers.internal"
  vpc  = aws_vpc.main.id
}

resource "aws_service_discovery_service" "ai" {
  name = "ai"

  dns_config {
    namespace_id   = aws_service_discovery_private_dns_namespace.main.id
    routing_policy = "MULTIVALUE"
    dns_records {
      ttl  = 10
      type = "A"
    }
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}
