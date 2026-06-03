output "alb_dns_name" {
  description = "Point your domain's A/CNAME records here"
  value       = aws_lb.main.dns_name
}

output "ecr_registry" {
  description = "ECR base URL — prefix all image tags with this"
  value       = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

output "ecr_repo_urls" {
  description = "Individual ECR repository URLs"
  value = {
    for k, r in aws_ecr_repository.app : k => r.repository_url
  }
}

output "redis_endpoint" {
  description = "ElastiCache Redis host (use inside the VPC only)"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "opensearch_endpoint" {
  description = "OpenSearch endpoint (only set when enable_opensearch = true)"
  value       = var.enable_opensearch ? aws_opensearch_domain.main[0].endpoint : "disabled"
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "private_subnet_ids" {
  description = "Paste into PRIVATE_SUBNET_IDS GitHub Actions variable"
  value       = join(",", aws_subnet.private[*].id)
}

output "ecs_security_group_id" {
  description = "Paste into ECS_SECURITY_GROUP_ID GitHub Actions variable"
  value       = aws_security_group.ecs.id
}

output "github_actions_role_arn" {
  description = "OIDC role ARN — paste into deploy.yml role-to-assume"
  value       = aws_iam_role.github_actions.arn
}

output "acm_certificate_validation_options" {
  description = "Add these DNS records to validate your TLS certificate"
  value = [
    for dvo in aws_acm_certificate.main.domain_validation_options : {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  ]
}
